/*
  queHacer.routes.js
  ----------------
  API de actividades "Que hacer" bajo `/api/que-hacer` (solo admin).
  - CRUD con imágenes; tabla `que_hacer`, id en columna `id_servicio`.
*/

const express = require('express');
const queHacerController = require('../controllers/queHacer.controller');
const { requireAdminApi } = require('../middleware/adminApi');
const { handleUploadContent } = require('../middleware/uploadContent');

const router = express.Router();

// Todas las rutas requieren sesion de administrador (JSON 403 si no)
router.use(requireAdminApi);

router.post('/', handleUploadContent, queHacerController.createQueHacer);
router.get('/', queHacerController.listQueHacer);
router.get('/:id', queHacerController.getQueHacer);
router.put('/:id', handleUploadContent, queHacerController.updateQueHacer);
router.delete('/:id', queHacerController.deleteQueHacer); // borra BD + carpeta img

module.exports = router;
