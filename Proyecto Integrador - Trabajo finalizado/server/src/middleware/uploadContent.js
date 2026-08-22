/*
  uploadContent.js
  ----------------
  Subida de imagenes en formularios de contenido (campo `imagenes`, multipart).
  - Acepta JPG, PNG y WebP; límite por archivo vía `MAX_IMAGE_SIZE_MB` (default 5 MB).
  - Máximo 5 archivos por request; memoria (`memoryStorage`) para guardar en disco después.
  - `handleUploadContent`: middleware Express que traduce errores de multer a JSON 400.
*/

const multer = require('multer');
const { isAllowedImageExtension } = require('../utils/imageExtensions');

const maxMb = Number(process.env.MAX_IMAGE_SIZE_MB) || 5;
const maxBytes = maxMb * 1024 * 1024;
const MAX_IMAGES = 5;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// Configuracion multer: buffers en RAM, filtro por tipo MIME.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
  // Rechaza archivos que no sean JPG, PNG o WebP.
  fileFilter(req, file, cb) {
    if (!isAllowedImageExtension(file.originalname)) {
      return cb(new Error('Extensión no permitida (use .jpg, .jpeg, .png o .webp)'));
    }
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no permitido (use JPG, PNG o WebP)'));
    }
  },
});

// Middleware crudo de multer (campo `imagenes`, hasta 5 archivos).
const uploadContentImages = upload.array('imagenes', MAX_IMAGES);

// Envuelve multer y devuelve mensajes de error legibles en JSON.
function handleUploadContent(req, res, next) {
  uploadContentImages(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        ok: false,
        message: `Cada imagen no puede superar ${maxMb} MB`,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        ok: false,
        message: `Máximo ${MAX_IMAGES} imágenes por publicación`,
      });
    }
    return res.status(400).json({ ok: false, message: err.message || 'Error al subir imágenes' });
  });
}

module.exports = { handleUploadContent, uploadContentImages, MAX_IMAGES };
