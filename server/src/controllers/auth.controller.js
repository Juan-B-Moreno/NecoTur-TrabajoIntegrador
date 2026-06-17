/*
  auth.controller.js
  ----------------
  Login, logout y sesión actual (`/api/auth`).
  - Login: valida usuario/contraseña, migra hash legacy, regenera sesión y redirige por rol.
  - `me`: devuelve JSON del usuario en sesion (navbar admin via `panel-auth.js`).
*/

const pool = require('../config/db');
const { verifyPassword, upgradePasswordIfLegacy } = require('../utils/password');

const REDIRECT_ADMIN = '/panel_admin.html';
const REDIRECT_USER = '/formulario_user.html';
const REDIRECT_LOGIN = '/formulario_login.html';

// Copia datos del usuario de BD a req.session.
function setSessionUser(req, row) {
  req.session.userId = row.id_usuario;
  req.session.nombre = row.nombre;
  req.session.usuario = row.usuario;
  req.session.rol = row.rol;
}

// POST login: redirect a panel admin o formulario usuario.
async function login(req, res) {
  const usuario = (req.body.usuario || '').trim();
  const password = req.body.password || '';

  if (!usuario || !password) {
    return res.redirect(`${REDIRECT_LOGIN}?error=1`);
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id_usuario, nombre, usuario, contrasenia, rol
       FROM usuarios WHERE usuario = ? LIMIT 1`,
      [usuario]
    );

    if (rows.length === 0) {
      return res.redirect(`${REDIRECT_LOGIN}?error=1`);
    }

    const row = rows[0];
    const valid = await verifyPassword(password, row.contrasenia);
    if (!valid) {
      return res.redirect(`${REDIRECT_LOGIN}?error=1`);
    }

    const newHash = await upgradePasswordIfLegacy(row.id_usuario, password, row.contrasenia);
    if (newHash !== row.contrasenia) {
      await pool.execute('UPDATE usuarios SET contrasenia = ? WHERE id_usuario = ?', [
        newHash,
        row.id_usuario,
      ]);
    }

    const redirectTo = row.rol === 'admin' ? REDIRECT_ADMIN : REDIRECT_USER;

    req.session.regenerate((err) => {
      if (err) {
        console.error('Error al regenerar sesión:', err.message);
        return res.redirect(`${REDIRECT_LOGIN}?error=1`);
      }
      setSessionUser(req, row);
      return res.redirect(redirectTo);
    });
  } catch (err) {
    console.error('Error en login:', err.message);
    return res.redirect(`${REDIRECT_LOGIN}?error=1`);
  }
}

// POST logout: destruye sesion y vuelve al login.
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error('Error al cerrar sesión:', err.message);
    res.redirect(REDIRECT_LOGIN);
  });
}

// GET me: usuario autenticado en JSON.
function me(req, res) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, message: 'No autenticado' });
  }
  res.json({
    ok: true,
    user: {
      id: req.session.userId,
      nombre: req.session.nombre,
      usuario: req.session.usuario,
      rol: req.session.rol,
    },
  });
}

module.exports = { login, logout, me };
