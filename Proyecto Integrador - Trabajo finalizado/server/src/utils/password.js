/*
  password.js
  ----------------
  Hash y verificacion de contraseñas (bcrypt + compatibilidad texto plano legacy).
  - `hashPassword` / `verifyPassword`: flujo actual con bcrypt.
  - `upgradePasswordIfLegacy`: re-hashea al login si la BD aún guarda texto plano.
  - Usado en `auth.controller` y `admin.controller`.
*/

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

// Detecta si el valor almacenado ya es un hash bcrypt
function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

// Genera hash bcrypt para contraseña en texto plano.
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Compara contraseña con hash bcrypt o, en legacy, texto plano.
async function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

// Devuelve nuevo hash si hace falta migrar desde texto plano.
async function upgradePasswordIfLegacy(userId, plain, stored) {
  if (isBcryptHash(stored)) return stored;
  return hashPassword(plain);
}

module.exports = {
  hashPassword,
  verifyPassword,
  upgradePasswordIfLegacy,
  isBcryptHash,
};
