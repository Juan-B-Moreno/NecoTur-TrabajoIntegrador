/*
  queVisitar.controller.js
  ----------------
  CRUD de lugares "Qué visitar" (admin + API pública).
  - Tabla `que_visitar`; PK `id_lugar`; campos info y contacto opcionales.
  - Respuestas admin con clave `lugares`.
*/

const pool = require('../config/db');
const { parsePagination, paginatedResponse, wantsRandom } = require('../utils/pagination');
const { insertThenSaveImages } = require('../utils/contentImageDb');
const {
  mapImageFields,
  applyImageUpdate,
  deletePublicationFolder,
} = require('../utils/contentImages');

const { logMovimiento } = require('../utils/auditLog');
const { sanitizeTextField } = require('../utils/sanitize');
const {
  parseFiltrosFromDb,
  serializeFiltrosToDb,
  parseFiltrosFromBody,
  buildFiltrosSql,
} = require('../utils/filtros');
const { getAllowedFiltros } = require('../utils/filtrosCatalogo');

// Consulta con creador para listados del panel
const LIST_SELECT = `
  SELECT q.id_lugar, q.nombre, q.descripcion, q.info, q.contacto, q.filtros, q.img_url,
         q.id_usuario, q.creado_en,
         u.usuario AS creador_usuario, u.nombre AS creador_nombre
  FROM que_visitar q
  LEFT JOIN usuarios u ON q.id_usuario = u.id_usuario
`;

// Objeto lugar para el frontend publico.
function mapQueVisitarPublic(row) {
  const imgs = mapImageFields(row, 'img_url');
  return {
    id: row.id_lugar,
    nombre: row.nombre,
    descripcion: row.descripcion,
    info: row.info,
    contacto: row.contacto,
    filtros: parseFiltrosFromDb(row.filtros),
    img_url: imgs.img_url,
    img_urls: imgs.img_urls,
  };
}

// Agrega img_url e img_urls a la fila de que_visitar.
function enrichQueVisitar(row) {
  return { ...row, filtros: parseFiltrosFromDb(row.filtros), ...mapImageFields(row, 'img_url') };
}

// Valida id_lugar desde la URL.
function parseId(param) {
  const id = Number(param);
  return id > 0 ? id : null;
}

// Valida nombre y descripcion; info y contacto son opcionales.
function validateQueVisitarBody(body, allowed = []) {
  const nombre = sanitizeTextField(body.nombre || '');
  const descripcion = sanitizeTextField(body.descripcion || '');
  const info = sanitizeTextField(body.info || body.informacion || '', { allowEmpty: true }) || null;
  const contacto = sanitizeTextField(body.contacto || '', { allowEmpty: true }) || null;

  if (!nombre) return { error: 'El nombre es obligatorio' };
  if (!descripcion) return { error: 'La descripción es obligatoria' };

  const filtros = parseFiltrosFromBody(body, allowed);
  return { nombre, descripcion, info, contacto, filtros };
}

// POST nuevo lugar con al menos una imagen.
async function createQueVisitar(req, res) {
  const allowed = await getAllowedFiltros('que_visitar');
  const parsed = validateQueVisitarBody(req.body, allowed);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  try {
    const outcome = await insertThenSaveImages({
      pool,
      tipo: 'que_visitar',
      nombre: parsed.nombre,
      files: req.files,
      insertSql: `INSERT INTO que_visitar (nombre, descripcion, info, contacto, filtros, id_usuario, img_url)
        VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      insertParams: [
        parsed.nombre,
        parsed.descripcion,
        parsed.info,
        parsed.contacto,
        serializeFiltrosToDb(parsed.filtros),
        req.session.userId,
      ],
      deleteSql: 'DELETE FROM que_visitar WHERE id_lugar = ?',
      updateImageSql: 'UPDATE que_visitar SET img_url = ? WHERE id_lugar = ?',
    });

    if (outcome.error) {
      return res.status(outcome.status).json({ ok: false, message: outcome.error });
    }

    res.status(201).json({
      ok: true,
      message: 'Lugar publicado correctamente',
      id: outcome.id,
    });
  } catch (err) {
    console.error('createQueVisitar:', err.message);
    res.status(500).json({
      ok: false,
      message: err.message || 'No se pudo crear el lugar',
    });
  }
}

// GET todos los lugares para la tabla de gestion.
async function listQueVisitar(req, res) {
  try {
    const [rows] = await pool.execute(`${LIST_SELECT} ORDER BY q.creado_en DESC`);
    res.json({ ok: true, lugares: rows.map(enrichQueVisitar) });
  } catch (err) {
    console.error('listQueVisitar:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la lista de lugares' });
  }
}

// GET un lugar por id_lugar (formulario editar).
async function getQueVisitar(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(`${LIST_SELECT} WHERE q.id_lugar = ? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Lugar no encontrado' });
    }
    res.json({ ok: true, lugar: enrichQueVisitar(rows[0]) });
  } catch (err) {
    console.error('getQueVisitar:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar el lugar' });
  }
}

// PUT actualiza lugar e imagenes asociadas.
async function updateQueVisitar(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  const allowed = await getAllowedFiltros('que_visitar');
  const parsed = validateQueVisitarBody(req.body, allowed);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT img_url FROM que_visitar WHERE id_lugar = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Lugar no encontrado' });
    }

    const imgResult = applyImageUpdate({
      tipo: 'que_visitar',
      id,
      nombre: parsed.nombre,
      existingRaw: existing[0].img_url,
      files: req.files,
      body: req.body,
    });
    if (imgResult.error) {
      return res.status(imgResult.status || 400).json({ ok: false, message: imgResult.error });
    }

    await pool.execute(
      `UPDATE que_visitar SET nombre = ?, descripcion = ?, info = ?, contacto = ?, filtros = ?, img_url = ? WHERE id_lugar = ?`,
      [
        parsed.nombre,
        parsed.descripcion,
        parsed.info,
        parsed.contacto,
        serializeFiltrosToDb(parsed.filtros),
        imgResult.serialized,
        id,
      ]
    );
    res.json({ ok: true, message: 'Lugar actualizado correctamente' });
    await logMovimiento(req, {
      accion: 'editar',
      entidad: 'que_visitar',
      entidad_id: id,
      entidad_titulo: parsed.nombre,
      detalle: `Editó lugar «${parsed.nombre}»`,
    });
  } catch (err) {
    console.error('updateQueVisitar:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo actualizar el lugar' });
  }
}

// GET listado publico paginado de lugares.
async function listPublicQueVisitar(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const random = wantsRandom(req.query);
  const allowed = await getAllowedFiltros('que_visitar');
  const selectedFiltros = parseFiltrosFromBody(req.query, allowed);
  const { clause, params } = buildFiltrosSql('q.filtros', selectedFiltros);

  try {
    if (random) {
      const [rows] = await pool.execute(
        `${LIST_SELECT} WHERE 1=1${clause} ORDER BY RAND() LIMIT ?`,
        [...params, limit]
      );
      const items = rows.map(mapQueVisitarPublic);
      return res.json(paginatedResponse(items, items.length, limit, 0, 'lugares'));
    }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM que_visitar q WHERE 1=1${clause}`,
      params
    );
    const [rows] = await pool.execute(
      `${LIST_SELECT} WHERE 1=1${clause} ORDER BY q.nombre ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows.map(mapQueVisitarPublic), total, limit, offset, 'lugares'));
  } catch (err) {
    console.error('listPublicQueVisitar:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar lugares' });
  }
}

// GET detalle publico de un lugar.
async function getPublicQueVisitar(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(`${LIST_SELECT} WHERE q.id_lugar = ? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Lugar no encontrado' });
    }
    res.json({ ok: true, lugar: mapQueVisitarPublic(rows[0]) });
  } catch (err) {
    console.error('getPublicQueVisitar:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar el lugar' });
  }
}

// DELETE registro y archivos en img/que-visitar/{id}.  
async function deleteQueVisitar(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT img_url, nombre FROM que_visitar WHERE id_lugar = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Lugar no encontrado' });
    }

    deletePublicationFolder('que_visitar', id);
    await pool.execute('DELETE FROM que_visitar WHERE id_lugar = ?', [id]);
    res.json({ ok: true, message: 'Lugar eliminado correctamente' });
    await logMovimiento(req, {
      accion: 'eliminar',
      entidad: 'que_visitar',
      entidad_id: id,
      entidad_titulo: existing[0].nombre,
      detalle: `Eliminó lugar «${existing[0].nombre}»`,
    });
  } catch (err) {
    console.error('deleteQueVisitar:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo eliminar el lugar' });
  }
}

module.exports = {
  createQueVisitar,
  listQueVisitar,
  listPublicQueVisitar,
  getQueVisitar,
  getPublicQueVisitar,
  updateQueVisitar,
  deleteQueVisitar,
};
