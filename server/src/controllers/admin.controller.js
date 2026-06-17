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
  } catch (err) {
    console.error('createUsuario:', err.message);
    const dup = mapDuplicateError(err);
    if (dup) return res.status(409).json({ ok: false, message: dup });
    res.status(500).json({ ok: false, message: 'No se pudo crear el usuario' });
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
      'SELECT id_usuario FROM usuarios WHERE id_usuario = ? LIMIT 1',
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
  getUsuario,
  createUsuario,
  updateUsuario,
};
