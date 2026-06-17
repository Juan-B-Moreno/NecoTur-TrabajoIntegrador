/*
  adminApi.js
  ----------------
  Middleware JSON para rutas de administración (`/api/admin`, listados admin).
  - Responde 401 si no hay sesión y 403 si el rol no es `admin`.
  - Aplicado con `router.use` en rutas admin y en GET global de noticias/servicios/etc.
*/

// Exige sesion de administrador para endpoints API.
function requireAdminApi(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, message: 'No autenticado' });
  }
  if (req.session.rol !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Sin permisos de administrador' });
  }
  next();
}

module.exports = { requireAdminApi };
