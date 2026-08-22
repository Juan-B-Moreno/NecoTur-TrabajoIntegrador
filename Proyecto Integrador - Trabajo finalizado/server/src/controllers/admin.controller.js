/*
  admin.controller.js
  ----------------
  Operaciones de administrador (`/api/admin`):
  - Listado/CRUD de usuarios con validación y hash de contraseña.
  - `listPublicacionesRecientes`: feed unificado de noticias, lugares, servicios y actividades.
*/

const pool = require('../config/db');
const {
  normalizeUsuarioBody,
  validateUsuarioInput,
  mapDuplicateError,
} = require('../utils/usuarios');
const { hashPassword } = require('../utils/password');
const { logMovimiento } = require('../utils/auditLog');

// GET todos los usuarios ordenados por rol y nombre
async function listUsuarios(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id_usuario, nombre, usuario, email, dni, rol
       FROM usuarios
       ORDER BY FIELD(rol, 'admin', 'usuario'), nombre ASC`
    );
    res.json({ ok: true, usuarios: rows });
  } catch (err) {
    console.error('listUsuarios:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la lista de usuarios' });
  }
}

// GET publicaciones recientes de todas las tablas de contenido (UNION)
async function listPublicacionesRecientes(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  try {
    const [rows] = await pool.execute(
      `
      SELECT * FROM (
        SELECT
          'Noticia' AS tipo,
          n.id_noticia AS id,
          n.nombre AS titulo,
          COALESCE(n.creado_en, CAST(n.fecha AS DATETIME), '1970-01-01') AS fecha_orden,
          u.usuario AS creador_usuario,
          u.nombre AS creador_nombre
        FROM noticias n
        LEFT JOIN usuarios u ON n.id_usuario = u.id_usuario

        UNION ALL

        SELECT
          'Qué visitar' AS tipo,
          q.id_lugar AS id,
          q.nombre AS titulo,
          COALESCE(q.creado_en, '1970-01-01') AS fecha_orden,
          u.usuario AS creador_usuario,
          u.nombre AS creador_nombre
        FROM que_visitar q
        LEFT JOIN usuarios u ON q.id_usuario = u.id_usuario

        UNION ALL

        SELECT
          'Servicio' AS tipo,
          s.id_servicio AS id,
          s.nombre AS titulo,
          COALESCE(s.creado_en, '1970-01-01') AS fecha_orden,
          u.usuario AS creador_usuario,
          u.nombre AS creador_nombre
        FROM servicios s
        LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario

        UNION ALL

        SELECT
          'Qué hacer' AS tipo,
          h.id_servicio AS id,
          h.nombre AS titulo,
          COALESCE(h.creado_en, '1970-01-01') AS fecha_orden,
          u.usuario AS creador_usuario,
          u.nombre AS creador_nombre
        FROM que_hacer h
        LEFT JOIN usuarios u ON h.id_usuario = u.id_usuario
      ) AS publicaciones
      ORDER BY fecha_orden DESC
      LIMIT ?
      `,
      [limit]
    );

    res.json({ ok: true, publicaciones: rows });
  } catch (err) {
    console.error('listPublicacionesRecientes:', err.message);
    res.status(500).json({
      ok: false,
      message:
        'No se pudo cargar publicaciones. ¿Ejecutaste public_html/bd/migracion_creador.sql en MySQL?',
    });
  }
}

// GET historial de movimientos (solo admin).
async function listMovimientos(req, res) {
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  try {
    const [rows] = await pool.execute(
      `SELECT id_movimiento, id_usuario, usuario_login, usuario_nombre,
              accion, entidad, entidad_id, entidad_titulo, detalle, creado_en
       FROM movimientos
       ORDER BY creado_en DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ ok: true, movimientos: rows });
  } catch (err) {
    console.error('listMovimientos:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar el registro de movimientos' });
  }
}

// GET un usuario por id
async function getUsuario(req, res) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id_usuario, nombre, usuario, email, dni, rol
       FROM usuarios WHERE id_usuario = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    res.json({ ok: true, usuario: rows[0] });
  } catch (err) {
    console.error('getUsuario:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar el usuario' });
  }
}

// POST crear usuario
async function createUsuario(req, res) {
  const data = normalizeUsuarioBody(req.body);
  const error = validateUsuarioInput(data, { requirePassword: true });
  if (error) {
    return res.status(400).json({ ok: false, message: error });
  }

  try {
    const hashed = await hashPassword(data.contrasena);
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, usuario, email, dni, contrasenia, rol)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.nombre, data.usuario, data.email, data.dni, hashed, data.rol]
    );
    res.status(201).json({
      ok: true,
      message: 'Usuario creado correctamente',
      id: result.insertId,
    });
    await logMovimiento(req, {
      accion: 'crear',
      entidad: 'usuario',
      entidad_id: result.insertId,
      entidad_titulo: data.usuario,
      detalle: `Creó usuario ${data.usuario} (${data.rol})`,
    });
  } catch (err) {
    console.error('createUsuario:', err.message);
    const dup = mapDuplicateError(err);
    if (dup) return res.status(409).json({ ok: false, message: dup });
    res.status(500).json({ ok: false, message: 'No se pudo crear el usuario' });
  }
}

// DELETE usuario: desvincula publicaciones y borra el registro.
async function deleteUsuario(req, res) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  if (req.session.userId === id) {
    return res.status(400).json({ ok: false, message: 'No podés eliminar tu propia cuenta.' });
  }

  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.execute(
      'SELECT id_usuario, rol, usuario, nombre FROM usuarios WHERE id_usuario = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    if (existing[0].rol === 'admin') {
      const [admins] = await conn.execute(
        `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'admin'`
      );
      if (Number(admins[0].total) <= 1) {
        return res.status(400).json({
          ok: false,
          message: 'No se puede eliminar el único administrador del sistema.',
        });
      }
    }

    await conn.beginTransaction();

    await conn.execute('UPDATE noticias SET id_usuario = NULL WHERE id_usuario = ?', [id]);
    await conn.execute('UPDATE servicios SET id_usuario = NULL WHERE id_usuario = ?', [id]);
    await conn.execute('UPDATE que_hacer SET id_usuario = NULL WHERE id_usuario = ?', [id]);
    await conn.execute('UPDATE que_visitar SET id_usuario = NULL WHERE id_usuario = ?', [id]);
    await conn.execute('DELETE FROM usuarios WHERE id_usuario = ?', [id]);

    await conn.commit();
    res.json({ ok: true, message: 'Usuario eliminado correctamente' });
    await logMovimiento(req, {
      accion: 'eliminar',
      entidad: 'usuario',
      entidad_id: id,
      entidad_titulo: existing[0].usuario,
      detalle: `Eliminó usuario ${existing[0].usuario}`,
    });
  } catch (err) {
    await conn.rollback();
    console.error('deleteUsuario:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo eliminar el usuario' });
  } finally {
    conn.release();
  }
}

// PUT actualizar usuario; sincroniza sesion si edita su propia cuenta.
async function updateUsuario(req, res) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  const data = normalizeUsuarioBody(req.body);
  const error = validateUsuarioInput(data, { requirePassword: false });
  if (error) {
    return res.status(400).json({ ok: false, message: error });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id_usuario, usuario FROM usuarios WHERE id_usuario = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    if (data.contrasena) {
      const hashed = await hashPassword(data.contrasena);
      await pool.execute(
        `UPDATE usuarios
         SET nombre = ?, usuario = ?, email = ?, dni = ?, contrasenia = ?, rol = ?
         WHERE id_usuario = ?`,
        [data.nombre, data.usuario, data.email, data.dni, hashed, data.rol, id]
      );
    } else {
      await pool.execute(
        `UPDATE usuarios
         SET nombre = ?, usuario = ?, email = ?, dni = ?, rol = ?
         WHERE id_usuario = ?`,
        [data.nombre, data.usuario, data.email, data.dni, data.rol, id]
      );
    }

    if (req.session.userId === id) {
      req.session.nombre = data.nombre;
      req.session.usuario = data.usuario;
      req.session.rol = data.rol;
    }

    res.json({ ok: true, message: 'Usuario actualizado correctamente' });
    await logMovimiento(req, {
      accion: 'editar',
      entidad: 'usuario',
      entidad_id: id,
      entidad_titulo: data.usuario,
      detalle: `Editó usuario ${existing[0].usuario}`,
    });
  } catch (err) {
    console.error('updateUsuario:', err.message);
    const dup = mapDuplicateError(err);
    if (dup) return res.status(409).json({ ok: false, message: dup });
    res.status(500).json({ ok: false, message: 'No se pudo actualizar el usuario' });
  }
}

module.exports = {
  listUsuarios,
  listPublicacionesRecientes,
  listMovimientos,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
};
