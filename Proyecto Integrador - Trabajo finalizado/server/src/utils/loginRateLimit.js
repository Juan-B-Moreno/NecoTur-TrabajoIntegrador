/*
  loginRateLimit.js — bloqueo temporal por IP tras intentos fallidos de login.
*/

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const LOCK_MS = LOCK_MINUTES * 60 * 1000;

/** @type {Map<string, { count: number, lockUntil: number }>} */
const store = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function getLockMessage(lockUntil) {
  const mins = Math.max(1, Math.ceil((lockUntil - Date.now()) / 60000));
  return `Demasiados intentos fallidos desde su conexión. Esperá ${mins} minuto(s) antes de volver a intentar.`;
}

function checkLoginAllowed(req) {
  const ip = getClientIp(req);
  const entry = store.get(ip);
  if (!entry) return { allowed: true, ip };

  if (entry.lockUntil && entry.lockUntil > Date.now()) {
    return { allowed: false, ip, message: getLockMessage(entry.lockUntil) };
  }

  if (entry.lockUntil && entry.lockUntil <= Date.now()) {
    store.delete(ip);
  }

  return { allowed: true, ip };
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const entry = store.get(ip) || { count: 0, lockUntil: 0 };
  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockUntil = now + LOCK_MS;
    entry.count = 0;
  }

  store.set(ip, entry);
}

function clearLoginAttempts(ip) {
  store.delete(ip);
}

module.exports = {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginAttempts,
  getClientIp,
  MAX_ATTEMPTS,
  LOCK_MINUTES,
};
