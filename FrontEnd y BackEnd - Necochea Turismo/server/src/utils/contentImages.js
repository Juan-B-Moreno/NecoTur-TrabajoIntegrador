/*
  contentImages.js
  ----------------
  Logica de imagenes en respuestas API y en actualizaciones de contenido.
  - `mapImageFields`: expone `img_url` (primera) e `img_urls` desde JSON/string en BD.
  - `applyImageUpdate`: elimina URLs indicadas, sube nuevas y serializa para UPDATE.
  - Reexporta `deletePublicationFolder` desde `imageUpload` para borrados.
*/

const fs = require('fs');
const {
  parseImagesFromDb,
  serializeImagesToDb,
  primaryImageUrl,
  saveUploadedImages,
  deleteImageIfExists,
  deletePublicationFolder,
  parseEliminarImagenes,
  validateImageCount,
  getPublicationDir,
} = require('./imageUpload');

// Calcula el siguiente numero de archivo segun nombres en la carpeta de la publicacion.
function getNextImageStartNum(tipo, id) {
  const dir = getPublicationDir(tipo, id);
  let maxNum = 0;
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/_(\d+)\.(jpg|jpeg|png|webp)$/i);
      if (m) maxNum = Math.max(maxNum, Number(m[1]));
    }
  }
  return maxNum + 1;
}

// Añade img_url e img_urls a una fila de BD
function mapImageFields(row, imageColumn = 'img_url') {
  const raw = row[imageColumn];
  const img_urls = parseImagesFromDb(raw);
  return {
    img_urls,
    img_url: primaryImageUrl(raw),
  };
}

// Procesa eliminar_imagenes + archivos nuevos; devuelve JSON serializado o error
function applyImageUpdate({ tipo, id, nombre, existingRaw, files, body }) {
  const toDelete = parseEliminarImagenes(body);
  let paths = parseImagesFromDb(existingRaw);

  // Quita del disco las URLs marcadas en el formulario de edición
  toDelete.forEach((p) => {
    if (paths.includes(p)) deleteImageIfExists(p);
  });
  paths = paths.filter((p) => !toDelete.includes(p));

  const newFiles = files || [];
  const countErr = validateImageCount(paths.length, newFiles.length);
  if (countErr) return { error: countErr.error, status: 400 };

  // Sube nuevas imagenes con numeracion continua (_1, _2, ...).
  if (newFiles.length) {
    const startNum = getNextImageStartNum(tipo, id);
    const added = saveUploadedImages({
      tipo,
      id,
      nombre,
      files: newFiles,
      startNum,
    });
    paths = paths.concat(added);
  }

  if (!paths.length) {
    return { error: 'Debe quedar al menos una imagen', status: 400 };
  }

  return { serialized: serializeImagesToDb(paths), paths };
}

module.exports = {
  mapImageFields,
  applyImageUpdate,
  deletePublicationFolder,
};
