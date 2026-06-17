/*
  auth.js
  ----------------
  Middleware de sesion para paginas HTML del panel (redirect, no JSON).
  - `requireAuth`: exige sesión activa.
  - `requireRole(...roles)`: exige sesión y uno de los roles indicados.
  - `requirePanelUser`: admin o usuario autenticado (formulario de contenido).
  - Usado en `app.js` al servir archivos `.html` protegidos.
*/

// Exige usuario logueado; si no, redirige al login.
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/formulario_login.html');
  }
  next();
}

// Exige sesion y rol permitido; redirige segun rol si no coincide.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.redirect('/formulario_login.html');
    }
    if (!roles.includes(req.session.rol)) {
      if (req.session.rol === 'admin') {
        return res.redirect('/panel_admin.html');
      }
      return res.redirect('/formulario_user.html');
    }
    next();
  };
}

// Permite panel a admin y usuario; otros roles vuelven al login
function requirePanelUser(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/formulario_login.html');
  }
  if (req.session.rol !== 'admin' && req.session.rol !== 'usuario') {
    return res.redirect('/formulario_login.html');
  }
  next();
}

module.exports = { requireAuth, requireRole, requirePanelUser };
