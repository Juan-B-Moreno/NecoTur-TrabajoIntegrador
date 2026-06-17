/*
  noticias.routes.js
  ----------------
  API de noticias bajo `/api/noticias` (sesion obligatoria).
  - Usuario: crear, ver/editar/borrar propias (`/mias`, permisos en controller).
  - Admin: listado global GET `/` con `requireAdminApi`.
  - POST/PUT usan `handleUploadContent` para imágenes multipart.
*/

const express = require('express');
const noticiasController = require('../controllers/noticias.controller');
const { requireAuthApi } = require('../middleware/contentAuth');
const { requireAdminApi } = require('../middleware/adminApi');
const { handleUploadContent } = require('../middleware/uploadContent');

const router = express.Router();

// Todas las rutas requieren sesion (JSON 401 si no hay login)
router.use(requireAuthApi);

router.post('/', handleUploadContent, noticiasController.createNoticia); // usuario crea noticia
router.get('/mias', noticiasController.listMisNoticias); // solo las del usuario logueado
router.get('/', requireAdminApi, noticiasController.listNoticias); // listado global admin
router.get('/:id', noticiasController.getNoticia); // detalle para editar (con permiso)
router.put('/:id', handleUploadContent, noticiasController.updateNoticia);
router.delete('/:id', noticiasController.deleteNoticia);

module.exports = router;
