/*
  contentAuth.js
  ----------------
  Autenticacion y permisos para API de contenido (JSON).
  - `requireAuthApi`: sesión obligatoria (401).
  - `isAdminSession` / `canModifyOwnerRecord`: admin ve/edita todo; usuario solo lo suyo.
  - Usado en rutas de noticias y controllers que validan propiedad del registro.
*/

// Exige sesion activa; responde JSON 401 si falta.
function requireAuthApi(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, message: 'No autenticado' });
  }
  next();
}

// Indica si la sesion actual es de administrador.
function isAdminSession(req) {
  return req.session && req.session.rol === 'admin';
}

// Admin puede todo; usuario solo registros con su id_usuario.
function canModifyOwnerRecord(req, ownerId) {
  if (isAdminSession(req)) return true;
  return Number(req.session.userId) === Number(ownerId);
}

module.exports = { requireAuthApi, isAdminSession, canModifyOwnerRecord };
