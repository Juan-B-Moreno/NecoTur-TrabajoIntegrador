/*
  queVisitar.routes.js
  ----------------
  API de lugares "Qué visitar" bajo `/api/que-visitar` (solo admin).
  - CRUD con imagenes; tabla `que_visitar`, id en columna `id_lugar`.
*/

const express = require('express');
const queVisitarController = require('../controllers/queVisitar.controller');
const { requireAdminApi } = require('../middleware/adminApi');
const { handleUploadContent } = require('../middleware/uploadContent');

const router = express.Router();

// Todas las rutas requieren sesion de administrador (JSON 403 si no)
router.use(requireAdminApi);

router.post('/', handleUploadContent, queVisitarController.createQueVisitar);
router.get('/', queVisitarController.listQueVisitar);
router.get('/:id', queVisitarController.getQueVisitar);
router.put('/:id', handleUploadContent, queVisitarController.updateQueVisitar);
router.delete('/:id', queVisitarController.deleteQueVisitar);

module.exports = router;
