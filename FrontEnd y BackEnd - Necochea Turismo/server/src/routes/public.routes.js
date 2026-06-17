/*
  public.routes.js
  ----------------
  API publica sin autenticacion bajo `/api/public`.
  - Listados paginados y detalle de noticias, servicios, qué hacer y qué visitar.
  - Consumido por scripts `public-site.js` y `public-lista-*.js` del frontend.
*/

const express = require('express');
const noticias = require('../controllers/noticias.controller');
const servicios = require('../controllers/servicios.controller');
const queHacer = require('../controllers/queHacer.controller');
const queVisitar = require('../controllers/queVisitar.controller');
const climaController = require('../controllers/clima.controller');

const router = express.Router();

// Listados con ?limit y ?offset; detalle por id sin login.
router.get('/noticias', noticias.listPublicNoticias);
router.get('/noticias/:id', noticias.getPublicNoticia);
router.get('/servicios', servicios.listPublicServicios);
router.get('/servicios/:id', servicios.getPublicServicio);
router.get('/que-hacer', queHacer.listPublicQueHacer);
router.get('/que-hacer/:id', queHacer.getPublicQueHacer);
router.get('/que-visitar', queVisitar.listPublicQueVisitar);
router.get('/que-visitar/:id', queVisitar.getPublicQueVisitar);
router.get('/clima', climaController.getClima);

module.exports = router;
