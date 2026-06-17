/*
  noticias.controller.js
  ----------------
  Lógica de noticias: panel (auth) y sitio público.
  - Admin: listado global; usuario: crear/editar/borrar propias (`canModifyOwnerRecord`).
  - Campos: título, descripción, info, fecha, dirección, imágenes en `img_url`.
  - Público: listado paginado y detalle sin datos de creador.
*/

const pool = require('../config/db');
const { canModifyOwnerRecord } = require('../middleware/contentAuth');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { insertThenSaveImages } = require('../utils/contentImageDb');
const {
  mapImageFields,
  applyImageUpdate,
  deletePublicationFolder,
} = require('../utils/contentImages');
const {
  NOTICIA_FILTROS,
  parseFiltrosFromDb,
  serializeFiltrosToDb,
  parseFiltrosFromBody,
  buildFiltrosSql,
} = require('../utils/filtros');

// Consulta base con datos de creador (join usuarios)
const LIST_SELECT = `
  SELECT n.id_noticia, n.nombre, n.descripcion, n.info, n.fecha, n.direccion, n.filtros,
         n.img_url, n.id_usuario, n.creado_en,
         u.usuario AS creador_usuario, u.nombre AS creador_nombre
  FROM noticias n
  LEFT JOIN usuarios u ON n.id_usuario = u.id_usuario
`;

// Formato reducido para API pública (sin id_usuario ni creador)
function mapNoticiaPublic(row) {
  const imgs = mapImageFields(row, 'img_url');
  return {
    id: row.id_noticia,
    nombre: row.nombre,
    descripcion: row.descripcion,
    info: row.info,
    fecha: row.fecha,
    direccion: row.direccion,
    filtros: parseFiltrosFromDb(row.filtros),
    img_url: imgs.img_url,
    img_urls: imgs.img_urls,
  };
}

// Fila completa del panel: añade img_url e img_urls parseadas desde BD
function enrichNoticia(row) {
  return { ...row, filtros: parseFiltrosFromDb(row.filtros), ...mapImageFields(row, 'img_url') };
}

// Convierte :id de la ruta a número; null si no es válido
function parseId(param) {
  const id = Number(param);
  return id > 0 ? id : null;
}

// Valida y normaliza body del formulario de noticia
function validateNoticiaBody(body) {
  const nombre = (body.nombre || body.titulo || '').trim();
  const descripcion = (body.descripcion || '').trim();
  const info = (body.info || body.contenido || '').trim() || null;
  const fecha = body.fecha || null;
  const direccion = (body.direccion || body.lugar || '').trim() || null;

  if (!nombre) return { error: 'El título es obligatorio' };
  if (!descripcion) return { error: 'La descripción es obligatoria' };
  if (descripcion.length > 200) return { error: 'La descripción no puede superar 200 caracteres' };
  if (!fecha) return { error: 'La fecha es obligatoria' };

  const filtros = parseFiltrosFromBody(body, NOTICIA_FILTROS);

  return { nombre, descripcion, info, fecha, direccion, filtros };
}

// POST crear noticia (usuario en sesion como autor).
async function createNoticia(req, res) {
  const parsed = validateNoticiaBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  try {
    const outcome = await insertThenSaveImages({
      pool,
      tipo: 'noticia',
      nombre: parsed.nombre,
      files: req.files,
      insertSql: `INSERT INTO noticias (nombre, descripcion, info, fecha, direccion, filtros, id_usuario, img_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      insertParams: [
        parsed.nombre,
        parsed.descripcion,
        parsed.info,
        parsed.fecha,
        parsed.direccion,
        serializeFiltrosToDb(parsed.filtros),
        req.session.userId,
      ],
      deleteSql: 'DELETE FROM noticias WHERE id_noticia = ?',
      updateImageSql: 'UPDATE noticias SET img_url = ? WHERE id_noticia = ?',
    });

    if (outcome.error) {
      return res.status(outcome.status).json({ ok: false, message: outcome.error });
    }

    res.status(201).json({
      ok: true,
      message: 'Noticia publicada correctamente',
      id: outcome.id,
    });
  } catch (err) {
    console.error('createNoticia:', err.message);
    res.status(500).json({
      ok: false,
      message: err.message || 'No se pudo crear la noticia',
    });
  }
}

// GET todas las noticias (solo admin, via requireAdminApi en routes).
async function listNoticias(req, res) {
  try {
    const [rows] = await pool.execute(`${LIST_SELECT} ORDER BY COALESCE(n.creado_en, n.fecha) DESC`);
    res.json({ ok: true, noticias: rows.map(enrichNoticia) });
  } catch (err) {
    console.error('listNoticias:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la lista de noticias' });
  }
}

// GET noticias del usuario logueado.
async function listMisNoticias(req, res) {
  try {
    const [rows] = await pool.execute(
      `${LIST_SELECT} WHERE n.id_usuario = ? ORDER BY COALESCE(n.creado_en, n.fecha) DESC`,
      [req.session.userId]
    );
    res.json({ ok: true, noticias: rows.map(enrichNoticia) });
  } catch (err) {
    console.error('listMisNoticias:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar tus noticias' });
  }
}

// GET una noticia para editar; verifica que sea el autor o admin.
async function getNoticia(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(`${LIST_SELECT} WHERE n.id_noticia = ? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Noticia no encontrada' });
    }
    const noticia = rows[0];
    if (!canModifyOwnerRecord(req, noticia.id_usuario)) {
      return res.status(403).json({ ok: false, message: 'Sin permiso para ver esta noticia' });
    }
    res.json({ ok: true, noticia: enrichNoticia(noticia) });
  } catch (err) {
    console.error('getNoticia:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la noticia' });
  }
}

// PUT actualiza texto, fecha e imágenes (eliminar/subir segun body).
async function updateNoticia(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  const parsed = validateNoticiaBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id_usuario, img_url FROM noticias WHERE id_noticia = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Noticia no encontrada' });
    }
    if (!canModifyOwnerRecord(req, existing[0].id_usuario)) {
      return res.status(403).json({ ok: false, message: 'Sin permiso para editar esta noticia' });
    }

    const imgResult = applyImageUpdate({
      tipo: 'noticia',
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
      `UPDATE noticias
       SET nombre = ?, descripcion = ?, info = ?, fecha = ?, direccion = ?, filtros = ?, img_url = ?
       WHERE id_noticia = ?`,
      [
        parsed.nombre,
        parsed.descripcion,
        parsed.info,
        parsed.fecha,
        parsed.direccion,
        serializeFiltrosToDb(parsed.filtros),
        imgResult.serialized,
        id,
      ]
    );
    res.json({ ok: true, message: 'Noticia actualizada correctamente' });
  } catch (err) {
    console.error('updateNoticia:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo actualizar la noticia' });
  }
}

// GET listado publico paginado.  
async function listPublicNoticias(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const selectedFiltros = parseFiltrosFromBody(req.query, NOTICIA_FILTROS);
  const { clause, params } = buildFiltrosSql('n.filtros', selectedFiltros);

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM noticias n WHERE 1=1${clause}`,
      params
    );
    const [rows] = await pool.execute(
      `${LIST_SELECT} WHERE 1=1${clause} ORDER BY n.id_noticia DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows.map(mapNoticiaPublic), total, limit, offset, 'noticias'));
  } catch (err) {
    console.error('listPublicNoticias:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar noticias' });
  }
}

// GET detalle publico por id (sin auth, sin datos de creador).
async function getPublicNoticia(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(`${LIST_SELECT} WHERE n.id_noticia = ? LIMIT 1`, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, message: 'Noticia no encontrada' });
    }
    res.json({ ok: true, noticia: mapNoticiaPublic(rows[0]) });
  } catch (err) {
    console.error('getPublicNoticia:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo cargar la noticia' });
  }
}

// DELETE borra fila, carpeta de imagenes y valida permisos de autor.
async function deleteNoticia(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID inválido' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id_usuario, img_url FROM noticias WHERE id_noticia = ? LIMIT 1',
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ ok: false, message: 'Noticia no encontrada' });
    }
    if (!canModifyOwnerRecord(req, existing[0].id_usuario)) {
      return res.status(403).json({ ok: false, message: 'Sin permiso para eliminar esta noticia' });
    }

    deletePublicationFolder('noticia', id);
    await pool.execute('DELETE FROM noticias WHERE id_noticia = ?', [id]);
    res.json({ ok: true, message: 'Noticia eliminada correctamente' });
  } catch (err) {
    console.error('deleteNoticia:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo eliminar la noticia' });
  }
}

module.exports = {
  createNoticia,
  listNoticias,
  listMisNoticias,
  listPublicNoticias,
  getNoticia,
  getPublicNoticia,
  updateNoticia,
  deleteNoticia,
};
