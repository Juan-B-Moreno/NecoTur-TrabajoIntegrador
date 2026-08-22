/*
  queHacer.controller.js
  ----------------
  CRUD de actividades "Qué hacer" (admin + API pública).
  - Tabla `que_hacer`; PK `id_servicio`; imágenes en `img_url`.
  - Respuestas admin usan clave `actividades`; público igual que otros tipos.
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

// SELECT con join a usuarios para panel admin
const LIST_SELECT = `
  SELECT h.id_servicio, h.nombre, h.descripcion, h.contacto, h.filtros, h.img_url,
         h.id_usuario, h.creado_en,
         u.usuario AS creador_usuario, u.nombre AS creador_nombre
  FROM que_hacer h
  LEFT JOIN usuarios u ON h.id_usuario = u.id_usuario
`;

// Objeto actividad para consumo del sitio público
function mapQueHacerPublic(row) {
  const imgs = mapImageFields(row, 'img_url');
  return {
    id: row.id_servicio,
    nombre: row.nombre,
    descripcion: row.descripcion,
    contacto: row.contacto,
    filtros: parseFiltrosFromDb(row.filtros),
    img_url: imgs.img_url,
    img_urls: imgs.img_urls,
  };
}

// Expande imágenes en la fila para respuestas del panel
function enrichQueHacer(row) {
  return { ...row, filtros: parseFiltrosFromDb(row.filtros), ...mapImageFields(row, 'img_url') };
}

// Parsea y valida el id de ruta (id_servicio en BD)
function parseId(param) {
  const id = Number(param);
  return id > 0 ? id : null;
}

// Valida nombre, descripción y contacto del formulario
function validateQueHacerBody(body, allowed = []) {
  const nombre = sanitizeTextField(body.nombre || '');
  const descripcion = sanitizeTextField(body.descripcion || '');
  const contacto = sanitizeTextField(body.contacto || '');

  if (!nombre) return { error: 'El nombre es obligatorio' };
  if (!descripcion) return { error: 'La descripción es obligatoria' };
  if (!contacto) return { error: 'El contacto es obligatorio' };

  const filtros = parseFiltrosFromBody(body, allowed);
  return { nombre, descripcion, contacto, filtros };
}

// POST nueva actividad con imágenes en disco
async function createQueHacer(req, res) {
  const allowed = await getAllowedFiltros('que_hacer');
  const parsed = validateQueHacerBody(req.body, allowed);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  try {
    const outcome = await insertThenSaveImages({
      pool,
      tipo: 'que_hacer',
      nombre: parsed.nombre,
      files: req.files,
      insertSql: `INSERT INTO que_hacer (nombre, descripcion, contacto, filtros, id_usuario, img_url)
        VALUES (?, ?, ?, ?, ?, NULL)`,
      insertParams: [
        parsed.nombre,
        parsed.descripcion,
        parsed.contacto,
        serializeFiltrosToDb(parsed.filtros),
        req.session.userId,
      ],
      deleteSql: 'DELETE FROM que_hacer WHERE id_servicio = ?',
      updateImageSql: 'UPDATE que_hacer SET img_url = ? WHERE id_servicio = ?',
    });

    if (outcome.error) {
      return res.status(outcome.status).json({ ok: false, message: outcome.error });
    }

    res.status(201).json({
      ok: true,
      message: 'Actividad publicada correctamente',
      id: outcome.id,
    });
  } catch (err) {
    console.error('createQueHacer:', err.message);
    res.status(500).json({
      ok: false,
      message: err.message || 'No se pudo crear la actividad',
    });
  }
}

// GET todas las actividades para gestionar-contenido admin
async function listQueHacer(req, res) {
  try {
    const [rows] = await pool.execute(`${LIST_SELECT} ORDER BY h.creado_en DESC`);
    res.json({ ok: true, actividades: rows.map(enrichQueHacer) });
  } catch (err) {
    console.error('listQueHacer:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la lista de actividades' });
  }
}

// GET una actividad por id para edición
async function getQueHacer(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(`${LIST_SELECT} WHERE h.id_servicio = ? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Actividad no encontrada' });
    }
    res.json({ ok: true, actividad: enrichQueHacer(rows[0]) });
  } catch (err) {
    console.error('getQueHacer:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la actividad' });
  }
}

// PUT modifica datos e imágenes de la actividad
async function updateQueHacer(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  const allowed = await getAllowedFiltros('que_hacer');
  const parsed = validateQueHacerBody(req.body, allowed);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT img_url FROM que_hacer WHERE id_servicio = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Actividad no encontrada' });
    }

    const imgResult = applyImageUpdate({
      tipo: 'que_hacer',
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
      `UPDATE que_hacer SET nombre = ?, descripcion = ?, contacto = ?, filtros = ?, img_url = ? WHERE id_servicio = ?`,
      [
        parsed.nombre,
        parsed.descripcion,
        parsed.contacto,
        serializeFiltrosToDb(parsed.filtros),
        imgResult.serialized,
        id,
      ]
    );
    res.json({ ok: true, message: 'Actividad actualizada correctamente' });
    await logMovimiento(req, {
      accion: 'editar',
      entidad: 'que_hacer',
      entidad_id: id,
      entidad_titulo: parsed.nombre,
      detalle: `Editó actividad «${parsed.nombre}»`,
    });
  } catch (err) {
    console.error('updateQueHacer:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo actualizar la actividad' });
  }
}

// GET listado publico paginado de actividades.
async function listPublicQueHacer(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const random = wantsRandom(req.query);
  const allowed = await getAllowedFiltros('que_hacer');
  const selectedFiltros = parseFiltrosFromBody(req.query, allowed);
  const { clause, params } = buildFiltrosSql('h.filtros', selectedFiltros);

  try {
    if (random) {
      const [rows] = await pool.execute(
        `${LIST_SELECT} WHERE 1=1${clause} ORDER BY RAND() LIMIT ?`,
        [...params, limit]
      );
      const items = rows.map(mapQueHacerPublic);
      return res.json(paginatedResponse(items, items.length, limit, 0, 'actividades'));
    }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM que_hacer h WHERE 1=1${clause}`,
      params
    );
    const [rows] = await pool.execute(
      `${LIST_SELECT} WHERE 1=1${clause} ORDER BY h.nombre ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows.map(mapQueHacerPublic), total, limit, offset, 'actividades'));
  } catch (err) {
    console.error('listPublicQueHacer:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar actividades' });
  }
}

// GET detalle sin auth para el sitio publico.
async function getPublicQueHacer(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(`${LIST_SELECT} WHERE h.id_servicio = ? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Actividad no encontrada' });
    }
    res.json({ ok: true, actividad: mapQueHacerPublic(rows[0]) });
  } catch (err) {
    console.error('getPublicQueHacer:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la actividad' });
  }
}

// DELETE fila y carpeta img/que-hacer/{id}
async function deleteQueHacer(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT img_url, nombre FROM que_hacer WHERE id_servicio = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Actividad no encontrada' });
    }

    deletePublicationFolder('que_hacer', id);
    await pool.execute('DELETE FROM que_hacer WHERE id_servicio = ?', [id]);
    res.json({ ok: true, message: 'Actividad eliminada correctamente' });
    await logMovimiento(req, {
      accion: 'eliminar',
      entidad: 'que_hacer',
      entidad_id: id,
      entidad_titulo: existing[0].nombre,
      detalle: `Eliminó actividad «${existing[0].nombre}»`,
    });
  } catch (err) {
    console.error('deleteQueHacer:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo eliminar la actividad' });
  }
}

module.exports = {
  createQueHacer,
  listQueHacer,
  listPublicQueHacer,
  getQueHacer,
  getPublicQueHacer,
  updateQueHacer,
  deleteQueHacer,
};
