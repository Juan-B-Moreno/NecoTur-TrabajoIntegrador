/*
  admin.routes.js
  ----------------
  API de administración bajo `/api/admin` (solo rol admin).
  - CRUD de usuarios y listado de publicaciones recientes unificadas.
  - Todas las rutas pasan por `requireAdminApi`.
*/

const express = require('express');
const adminController = require('../controllers/admin.controller');
const filtrosController = require('../controllers/filtros.controller');
const { requireAdminApi } = require('../middleware/adminApi');

const router = express.Router();

router.use(requireAdminApi);

router.get('/usuarios', adminController.listUsuarios); // gestionar-usuarios.html
router.post('/usuarios', adminController.createUsuario);
router.get('/usuarios/:id', adminController.getUsuario); // editar-usuario.html
router.put('/usuarios/:id', adminController.updateUsuario);
router.delete('/usuarios/:id', adminController.deleteUsuario);
router.get('/publicaciones-recientes', adminController.listPublicacionesRecientes); // panel admin
router.get('/movimientos', adminController.listMovimientos);
router.get('/filtros', filtrosController.listAdminFiltros);
router.post('/filtros', filtrosController.createFiltroAdmin);
router.delete('/filtros/:id', filtrosController.deleteFiltroAdmin);

module.exports = router;
