/*
  usuarios.js
  ----------------
  Validación y normalización de datos de usuario (API admin).
  - `normalizeUsuarioBody`: trim, email en minusculas, rol admin|usuario.
  - `validateUsuarioInput`: reglas de campos obligatorios y contraseña.
  - `mapDuplicateError`: mensajes amigables para usuario/email duplicado en MySQL.
*/

// Normaliza campos del body antes de insertar/actualizar.
function normalizeUsuarioBody(body) {
  return {
    nombre: (body.nombre || '').trim(),
    usuario: (body.usuario || '').trim(),
    email: (body.email || '').trim().toLowerCase(),
    dni: (body.dni || '').trim() || null,
    contrasena: body.contrasena != null ? String(body.contrasena) : '',
    rol: body.rol === 'admin' ? 'admin' : 'usuario',
  };
}

// Devuelve mensaje de error o null si los datos son validos.
function validateUsuarioInput(data, { requirePassword }) {
  if (!data.nombre) return 'El nombre completo es obligatorio.';
  if (!data.usuario) return 'El nombre de usuario es obligatorio.';
  if (data.usuario.length < 3) return 'El usuario debe tener al menos 3 caracteres.';
  if (!data.email) return 'El email es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'El email no es válido.';
  if (requirePassword && !data.contrasena) return 'La contraseña es obligatoria.';
  if (data.contrasena && data.contrasena.length < 4) {
    return 'La contraseña debe tener al menos 4 caracteres.';
  }
  return null;
}

// Traduce ER_DUP_ENTRY de MySQL a texto para el cliente. 
function mapDuplicateError(err) {
  if (err.code !== 'ER_DUP_ENTRY') return null;
  const msg = err.message || '';
  if (msg.includes('usuario')) return 'Ese nombre de usuario ya está en uso.';
  if (msg.includes('email')) return 'Ese email ya está registrado.';
  return 'Ya existe un registro con esos datos.';
}

module.exports = { normalizeUsuarioBody, validateUsuarioInput, mapDuplicateError };
