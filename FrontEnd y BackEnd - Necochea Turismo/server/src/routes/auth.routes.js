/*
  auth.routes.js
  ----------------
  Rutas de autenticacion bajo `/api/auth`.
  - POST `/login`, POST `/logout`, GET `/me` (sesión actual en JSON).
  - Montado en `app.js`; consumido por formulario de login y `panel-auth.js`.
*/

const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', authController.login); // form HTML, redirect segun rol
router.post('/logout', authController.logout);
router.get('/me', authController.me); // JSON para navbar admin (panel-auth.js)

module.exports = router;
