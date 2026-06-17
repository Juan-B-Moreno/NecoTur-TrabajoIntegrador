/*
  contentImageDb.js
  ----------------
  Flujo transaccional: insertar fila en BD y luego guardar imagenes en disco.
  - Inserta registro, sube archivos a `public_html/img/...`, actualiza columna de URLs.
  - Si falla la subida, borra el registro insertado (rollback manual).
  - Usado por controllers de noticias, servicios, que hacer y que visitar al crear.
*/

const {
  saveUploadedImages,
  requireImagesOnCreate,
  serializeImagesToDb,
} = require('./imageUpload');

// Crea publicacion, guarda imagenes y actualiza URL; revierte si hay error.
async function insertThenSaveImages({
  pool,
  insertSql,
  insertParams,
  deleteSql,
  updateImageSql,
  tipo,
  nombre,
  files,
}) {
  const imgErr = requireImagesOnCreate(files);
  if (imgErr) return { error: imgErr.error, status: 400 };

  // 1) Inserta fila sin imagenes para obtener el id de carpeta.
  const [result] = await pool.execute(insertSql, insertParams);
  const id = result.insertId;

  try {
    // 2) Guarda archivos en public_html/img/{tipo}/{id}/.
    const webPaths = saveUploadedImages({ tipo, id, nombre, files, startNum: 1 });
    const serialized = serializeImagesToDb(webPaths);
    // 3) Persiste JSON de URLs en la columna de imagenes.
    await pool.execute(updateImageSql, [serialized, id]);
    return { ok: true, id, webPaths };
  } catch (err) {
    // Si falla disco o UPDATE, deshace el INSERT.  
    await pool.execute(deleteSql, [id]);
    throw err;
  }
}

module.exports = { insertThenSaveImages };
