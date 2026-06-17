/*
  servicios.routes.js
  ----------------
  API de servicios bajo `/api/servicios` (solo admin).
  - CRUD completo con subida de imagenes en POST y PUT.
  - Listado admin y endpoints publicos estan en `public.routes.js`.
*/  

const express = require('express');
const serviciosController = require('../controllers/servicios.controller');
const { requireAdminApi } = require('../middleware/adminApi');
const { handleUploadContent } = require('../middleware/uploadContent');

const router = express.Router();

router.use(requireAdminApi);

router.post('/', handleUploadContent, serviciosController.createServicio);
router.get('/', serviciosController.listServicios); // tabla gestionar servicios
router.get('/:id', serviciosController.getServicio); // carga formulario editar
router.put('/:id', handleUploadContent, serviciosController.updateServicio);
router.delete('/:id', serviciosController.deleteServicio); // borra BD + carpeta img

module.exports = router;
