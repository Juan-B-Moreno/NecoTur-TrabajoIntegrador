/*
  sanitize.js — validación y limpieza de entradas de texto.
  - sanitizeTextField: campos de contenido (quita HTML y caracteres de control).
  - validateLoginCredential: reglas estrictas solo para login.
*/

const LOGIN_FORBIDDEN = /[|/{}´()`_\-]/;

function hasAccentsOrEnye(value) {
  if (/ñ/i.test(value)) return true;
  const stripped = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return stripped !== value;
}

/** Limpia texto de formularios de contenido (no login). */
function sanitizeTextField(value, { maxLength, allowEmpty = true } = {}) {
  if (value == null || value === '') {
    return allowEmpty ? '' : null;
  }
  let s = String(value);
  s = s.replace(/<[^>]*>/g, '');
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  s = s.trim();
  if (maxLength && s.length > maxLength) {
    s = s.slice(0, maxLength);
  }
  return s;
}

/** Valida usuario/contraseña en login. Devuelve mensaje de error o null. */
function validateLoginCredential(value, label = 'Este campo') {
  if (value == null || String(value).length === 0) {
    return `${label} es obligatorio.`;
  }
  const s = String(value);
  if (LOGIN_FORBIDDEN.test(s)) {
    return `${label} no puede contener los caracteres | / { } ´ ( ) - _`;
  }
  if (hasAccentsOrEnye(s)) {
    return `${label} no puede contener acentos ni la letra ñ.`;
  }
  return null;
}

module.exports = {
  sanitizeTextField,
  validateLoginCredential,
};
