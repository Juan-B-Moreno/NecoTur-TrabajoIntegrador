/*
  auth.controller.js
  ----------------
  Login, logout y sesión actual (`/api/auth`).
  - Login: valida usuario/contraseña, migra hash legacy, regenera sesión y redirige por rol.
  - `me`: devuelve JSON del usuario en sesion (navbar admin via `panel-auth.js`).
*/

const pool = require('../config/db');
const { verifyPassword, upgradePasswordIfLegacy } = require('../utils/password');
const { validateLoginCredential } = require('../utils/sanitize');
const {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginAttempts,
} = require('../utils/loginRateLimit');

const REDIRECT_ADMIN = '/panel_admin.html';
const REDIRECT_USER = '/formulario_user.html';
const REDIRECT_LOGIN = '/formulario_login.html';
const SESSION_MAX_AGE =
  (Number(process.env.SESSION_MAX_AGE_MINUTES) || 5) * 60 * 1000;

function wantsJson(req) {
  const accept = req.headers.accept || '';
  return accept.includes('application/json');
}

function redirectForRole(rol) {
  return rol === 'admin' ? REDIRECT_ADMIN : REDIRECT_USER;
}

// Copia datos del usuario de BD a req.session.
function setSessionUser(req, row) {
  req.session.userId = row.id_usuario;
  req.session.nombre = row.nombre;
  req.session.usuario = row.usuario;
  req.session.rol = row.rol;
  req.session.cookie.maxAge = SESSION_MAX_AGE;
}

// POST login: redirect a panel admin o formulario usuario.
async function login(req, res) {
  const lockCheck = checkLoginAllowed(req);
  if (!lockCheck.allowed) {
    if (wantsJson(req)) {
      return res.status(429).json({ ok: false, message: lockCheck.message });
    }
    return res.redirect(`${REDIRECT_LOGIN}?error=rate`);
  }

  const usuario = (req.body.usuario || '').trim();
  const password = req.body.password || '';

  const usuarioErr = validateLoginCredential(usuario, 'El usuario');
  const passwordErr = validateLoginCredential(password, 'La contraseña');
  if (usuarioErr || passwordErr) {
    recordLoginFailure(lockCheck.ip);
    const message = usuarioErr || passwordErr;
    if (wantsJson(req)) {
      return res.status(400).json({ ok: false, message });
    }
    return res.redirect(`${REDIRECT_LOGIN}?error=1`);
  }

  if (!usuario || !password) {
    if (wantsJson(req)) {
      return res.status(400).json({ ok: false, message: 'Usuario y contraseña son obligatorios' });
    }
    return res.redirect(`${REDIRECT_LOGIN}?error=1`);
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id_usuario, nombre, usuario, contrasenia, rol
       FROM usuarios WHERE usuario = ? LIMIT 1`,
      [usuario]
    );

    if (rows.length === 0) {
      recordLoginFailure(lockCheck.ip);
      if (wantsJson(req)) {
        return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos' });
      }
      return res.redirect(`${REDIRECT_LOGIN}?error=1`);
    }

    const row = rows[0];
    const valid = await verifyPassword(password, row.contrasenia);
    if (!valid) {
      recordLoginFailure(lockCheck.ip);
      if (wantsJson(req)) {
        return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos' });
      }
      return res.redirect(`${REDIRECT_LOGIN}?error=1`);
    }

    clearLoginAttempts(lockCheck.ip);

    const newHash = await upgradePasswordIfLegacy(row.id_usuario, password, row.contrasenia);
    if (newHash !== row.contrasenia) {
      await pool.execute('UPDATE usuarios SET contrasenia = ? WHERE id_usuario = ?', [
        newHash,
        row.id_usuario,
      ]);
    }

    const redirectTo = redirectForRole(row.rol);

    req.session.regenerate((err) => {
      if (err) {
        console.error('Error al regenerar sesión:', err.message);
        if (wantsJson(req)) {
          return res.status(500).json({ ok: false, message: 'Error al iniciar sesión' });
        }
        return res.redirect(`${REDIRECT_LOGIN}?error=1`);
      }
      setSessionUser(req, row);
      if (wantsJson(req)) {
        return res.json({
          ok: true,
          user: {
            id: row.id_usuario,
            nombre: row.nombre,
            usuario: row.usuario,
            rol: row.rol,
          },
          redirectTo,
        });
      }
      return res.redirect(redirectTo);
    });
  } catch (err) {
    console.error('Error en login:', err.message);
    if (wantsJson(req)) {
      return res.status(500).json({ ok: false, message: 'Error al iniciar sesión' });
    }
    return res.redirect(`${REDIRECT_LOGIN}?error=1`);
  }
}

// POST logout: destruye sesion y vuelve al login.
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error('Error al cerrar sesión:', err.message);
    if (wantsJson(req)) {
      return res.json({ ok: true });
    }
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
