/*
  imageUpload.js
  ----------------
  Almacenamiento fisico de imagenes de contenido en `public_html/img/`.
  - Carpetas por tipo: noticia, servicio, que-hacer, que-visitar + id de publicación.
  - Nombres de archivo: slug del titulo + fecha + numero (ej. `mi-titulo_2024-06-04_1.jpg`).
  - Parse/serializa arrays de URLs en BD; borra archivos y carpetas al eliminar contenido.
  - Base de `contentImages.js` y `contentImageDb.js`.
*/

const fs = require('fs');
const path = require('path');
const { publicHtmlPath } = require('../config/paths');
const MAX_IMAGES = 5;

// Mapeo tipo logico -> carpeta bajo /img
const TIPO_CARPETA = {
  noticia: 'noticia',
  servicio: 'servicio',
  que_hacer: 'que-hacer',
  que_visitar: 'que-visitar',
};

// Extension de archivo segun tipo MIME del upload
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

  // Convierte titulo a slug seguro para nombre de archivo
function slugifyTitulo(nombre) {
  return (nombre || 'sin-titulo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sin-titulo';
}

// Fecha de hoy en formato YYYY-MM-DD para el nombre del archivo
function uploadDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Arma nombre: slug_fecha_numero.ext (ej. parque-central_2024-06-04_2.jpg)
function buildImageFileName(nombre, ext, imgNum) {
  const slug = slugifyTitulo(nombre);
  const date = uploadDateString();
  const safeExt = ext.startsWith('.') ? ext : `.${ext}`;
  return `${slug}_${date}_${imgNum}${safeExt}`;
}

// Crea y devuelve ruta absoluta img/{tipo}/{id}
function getPublicationDir(tipo, id) {
  const carpeta = TIPO_CARPETA[tipo];
  if (!carpeta) throw new Error('Tipo de contenido inválido');
  const dir = path.join(publicHtmlPath, 'img', carpeta, String(id));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Ruta URL servida al navegador; opcional prefijo PUBLIC_BASE_URL
function toWebPath(tipo, id, fileName) {
  const carpeta = TIPO_CARPETA[tipo];
  const relative = `/img/${carpeta}/${id}/${fileName}`;
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  return base ? `${base}${relative}` : relative;
}

// Obtiene extension desde mimetype multer o nombre original del archivo
function resolveExtension(file) {
  const fromMime = MIME_EXT[file.mimetype];
  if (fromMime) return fromMime;
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    return ext === '.jpeg' ? '.jpg' : ext;
  }
  return null;
}

// Convierte columna BD (string, JSON o array) a lista de URLs.
function parseImagesFromDb(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const str = String(value).trim();
  if (!str) return [];
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [str];
    }
  }
  return [str];
}

// Guarda array de URLs como JSON string para la columna de imagenes.
function serializeImagesToDb(paths) {
  const list = (paths || []).filter(Boolean);
  if (!list.length) return null;
  return JSON.stringify(list);
}

// Primera URL del listado (miniatura / carrusel principal).
function primaryImageUrl(value) {
  const list = parseImagesFromDb(value);
  return list[0] || null;
}

// Escribe un buffer multer en disco y devuelve ruta web (/img/...).
function saveUploadedImage({ tipo, id, nombre, file, imgNum }) {
  const ext = resolveExtension(file);
  if (!ext) {
    throw new Error('Formato de imagen no permitido (use JPG, PNG o WebP)');
  }

  const fileName = buildImageFileName(nombre, ext, imgNum);
  const dir = getPublicationDir(tipo, id);
  const absolutePath = path.join(dir, fileName);

  fs.writeFileSync(absolutePath, file.buffer);
  return toWebPath(tipo, id, fileName);
}

// Guarda varios archivos de un request y devuelve array de rutas web.
function saveUploadedImages({ tipo, id, nombre, files, startNum = 1 }) {
  const paths = [];
  files.forEach((file, index) => {
    paths.push(
      saveUploadedImage({ tipo, id, nombre, file, imgNum: startNum + index })
    );
  });
  return paths;
}

// Convierte /img/... a ruta absoluta en disco; valida que quede dentro de img/.
function webPathToAbsolute(webPath) {
  if (!webPath || typeof webPath !== 'string') return null;

  let relative = webPath;
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (base && webPath.startsWith(base)) {
    relative = webPath.slice(base.length);
  }

  if (!relative.startsWith('/img/')) return null;

  const absolutePath = path.join(
    publicHtmlPath,
    relative.replace(/^\//, '').split('/').join(path.sep)
  );
  const imgRoot = path.join(publicHtmlPath, 'img');

  if (!absolutePath.startsWith(imgRoot)) return null;
  return absolutePath;
}

// Borra un archivo fisico si la URL web es valida y existe.
function deleteImageIfExists(webPath) {
  const absolutePath = webPathToAbsolute(webPath);
  if (!absolutePath) return;

  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.error('deleteImageIfExists:', err.message);
  }
}

// Elimina en disco todas las URLs de un valor BD (string o JSON).
function deleteImagesIfExist(webPaths) {
  parseImagesFromDb(webPaths).forEach(deleteImageIfExists);
}

// Elimina carpeta completa de una publicacion (al borrar contenido).
function deletePublicationFolder(tipo, id) {
  const carpeta = TIPO_CARPETA[tipo];
  if (!carpeta || !id) return;
  const dir = path.join(publicHtmlPath, 'img', carpeta, String(id));
  const imgRoot = path.join(publicHtmlPath, 'img');

  if (!dir.startsWith(imgRoot) || !fs.existsSync(dir)) return;

  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.error('deletePublicationFolder:', err.message);
  }
}

// Exige entre 1 y MAX_IMAGES archivos al crear contenido nuevo.
function requireImagesOnCreate(files) {
  if (!files || !files.length) {
    return { error: 'Al menos una imagen es obligatoria' };
  }
  if (files.length > MAX_IMAGES) {
    return { error: `Máximo ${MAX_IMAGES} imágenes por publicación` };
  }
  return null;
}

  // Comprueba que al sumar nuevas no se supere el maximo de 5 imagenes.
function validateImageCount(currentCount, newCount) {
  if (currentCount + newCount > MAX_IMAGES) {
    return {
      error: `Máximo ${MAX_IMAGES} imágenes por publicación (tenés ${currentCount}, intentás agregar ${newCount})`,
    };
  }
  return null;
}

// Lee array JSON del campo eliminar_imagenes del formulario.
function parseEliminarImagenes(body) {
  if (!body || !body.eliminar_imagenes) return [];
  try {
    const parsed = JSON.parse(body.eliminar_imagenes);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

  // Numero siguiente si se usa longitud del array (helper alternativo o copia).
function nextImageStartNum(existingPaths) {
  return existingPaths.length + 1;
}

module.exports = {
  MAX_IMAGES,
  TIPO_CARPETA,
  slugifyTitulo,
  buildImageFileName,
  getPublicationDir,
  saveUploadedImage,
  saveUploadedImages,
  deleteImageIfExists,
  deleteImagesIfExist,
  deletePublicationFolder,
  requireImagesOnCreate,
  validateImageCount,
  parseImagesFromDb,
  serializeImagesToDb,
  primaryImageUrl,
  parseEliminarImagenes,
  nextImageStartNum,
  resolveExtension,
};
