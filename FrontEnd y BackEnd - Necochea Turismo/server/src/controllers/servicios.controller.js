/*
  servicios.controller.js
  ----------------
  CRUD de servicios turísticos (solo admin en rutas `/api/servicios`).
  - Imagenes en columna `url_imagen`; listado/detalle publico en endpoints `/api/public`.
  - Campos: nombre, descripción, contacto.
*/

const pool = require('../config/db');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { insertThenSaveImages } = require('../utils/contentImageDb');
const {
  mapImageFields,
  applyImageUpdate,
  deletePublicationFolder,
} = require('../utils/contentImages');
const {
  SERVICIO_FILTROS,
  parseFiltrosFromDb,
  serializeFiltrosToDb,
  parseFiltrosFromBody,
  buildFiltrosSql,
} = require('../utils/filtros');

// Consulta base con creador para listados admin.
const LIST_SELECT = `
  SELECT s.id_servicio, s.nombre, s.descripcion, s.contacto, s.filtros, s.url_imagen,
         s.id_usuario, s.creado_en,
         u.usuario AS creador_usuario, u.nombre AS creador_nombre
  FROM servicios s
  LEFT JOIN usuarios u ON s.id_usuario = u.id_usuario
`;

  // Respuesta publico sin metadatos de panel.
function mapServicioPublic(row) {
  const imgs = mapImageFields(row, 'url_imagen');
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

// Añade img_url/img_urls a la fila (columna url_imagen en servicios).
function enrichServicio(row) {
  return { ...row, filtros: parseFiltrosFromDb(row.filtros), ...mapImageFields(row, 'url_imagen') };
}

// Valida id numérico positivo desde req.params.
function parseId(param) {
  const id = Number(param);
  return id > 0 ? id : null;
}

// Valida nombre, descripcion y contacto.
function validateServicioBody(body) {
  const nombre = (body.nombre || '').trim();
  const descripcion = (body.descripcion || '').trim();
  const contacto = (body.contacto || '').trim();

  if (!nombre) return { error: 'El nombre es obligatorio' };
  if (!descripcion) return { error: 'La descripción es obligatoria' };
  if (!contacto) return { error: 'El contacto es obligatorio' };

  const filtros = parseFiltrosFromBody(body, SERVICIO_FILTROS);

  return { nombre, descripcion, contacto, filtros };
}

// POST alta con imágenes obligatorias y admin en sesion.
async function createServicio(req, res) {
  const parsed = validateServicioBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  try {
    const outcome = await insertThenSaveImages({
      pool,
      tipo: 'servicio',
      nombre: parsed.nombre,
      files: req.files,
      insertSql: `INSERT INTO servicios (nombre, descripcion, contacto, filtros, id_usuario, url_imagen)
        VALUES (?, ?, ?, ?, ?, NULL)`,
      insertParams: [
        parsed.nombre,
        parsed.descripcion,
        parsed.contacto,
        serializeFiltrosToDb(parsed.filtros),
        req.session.userId,
      ],
      deleteSql: 'DELETE FROM servicios WHERE id_servicio = ?',
      updateImageSql: 'UPDATE servicios SET url_imagen = ? WHERE id_servicio = ?',
    });

    if (outcome.error) {
      return res.status(outcome.status).json({ ok: false, message: outcome.error });
    }

    res.status(201).json({
      ok: true,
      message: 'Servicio publicado correctamente',
      id: outcome.id,
    });
  } catch (err) {
    console.error('createServicio:', err.message);
    res.status(500).json({
      ok: false,
      message: err.message || 'No se pudo crear el servicio',
    });
  }
}

// GET listado completo para gestion admin.
async function listServicios(req, res) {
  try {
    const [rows] = await pool.execute(`${LIST_SELECT} ORDER BY s.creado_en DESC`);
    res.json({ ok: true, servicios: rows.map(enrichServicio) });
  } catch (err) {
    console.error('listServicios:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la lista de servicios' });
  }
}

// GET un servicio por id (formulario editar)
async function getServicio(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(`${LIST_SELECT} WHERE s.id_servicio = ? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
    }
    res.json({ ok: true, servicio: enrichServicio(rows[0]) });
  } catch (err) {
    console.error('getServicio:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar el servicio' });
  }
}

// PUT actualiza campos e imagenes del servicio.
async function updateServicio(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  const parsed = validateServicioBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT url_imagen FROM servicios WHERE id_servicio = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
    }

    const imgResult = applyImageUpdate({
      tipo: 'servicio',
      id,
      nombre: parsed.nombre,
      existingRaw: existing[0].url_imagen,
      files: req.files,
      body: req.body,
    });
    if (imgResult.error) {
      return res.status(imgResult.status || 400).json({ ok: false, message: imgResult.error });
    }

    await pool.execute(
      `UPDATE servicios SET nombre = ?, descripcion = ?, contacto = ?, filtros = ?, url_imagen = ? WHERE id_servicio = ?`,
      [
        parsed.nombre,
        parsed.descripcion,
        parsed.contacto,
        serializeFiltrosToDb(parsed.filtros),
        imgResult.serialized,
        id,
      ]
    );
    res.json({ ok: true, message: 'Servicio actualizado correctamente' });
  } catch (err) {
    console.error('updateServicio:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo actualizar el servicio' });
  }
}

// GET listado publico paginado.
async function listPublicServicios(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const selectedFiltros = parseFiltrosFromBody(req.query, SERVICIO_FILTROS);
  const { clause, params } = buildFiltrosSql('s.filtros', selectedFiltros);

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM servicios s WHERE 1=1${clause}`,
      params
    );
    const [rows] = await pool.execute(
      `${LIST_SELECT} WHERE 1=1${clause} ORDER BY s.id_servicio DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows.map(mapServicioPublic), total, limit, offset, 'servicios'));
  } catch (err) {
    console.error('listPublicServicios:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar servicios' });
  }
}

// GET detalle para pagina publico detalle-servicios.html.
async function getPublicServicio(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(`${LIST_SELECT} WHERE s.id_servicio = ? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
    }
    res.json({ ok: true, servicio: mapServicioPublic(rows[0]) });
  } catch (err) {
    console.error('getPublicServicio:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar el servicio' });
  }
}

// DELETE registro y carpeta img/servicio/{id}
async function deleteServicio(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT url_imagen FROM servicios WHERE id_servicio = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
    }

    deletePublicationFolder('servicio', id);
    await pool.execute('DELETE FROM servicios WHERE id_servicio = ?', [id]);
    res.json({ ok: true, message: 'Servicio eliminado correctamente' });
  } catch (err) {
    console.error('deleteServicio:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo eliminar el servicio' });
  }
}

module.exports = {
  createServicio,
  listServicios,
  listPublicServicios,
  getServicio,
  getPublicServicio,
  updateServicio,
  deleteServicio,
};
