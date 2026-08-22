/**
 * Pruebas de hash de contraseñas y autenticación.
 * Uso: node scripts/test-auth-password.js
 * Requiere servidor en http://localhost:3000 para pruebas de integración.
 */
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');
const {
  hashPassword,
  verifyPassword,
  upgradePasswordIfLegacy,
  isBcryptHash,
} = require('../src/utils/password');

const BASE = process.env.API_BASE || 'http://localhost:3000';
const ADMIN_USER = '_test_auth_admin';
const ADMIN_PASS = 'auth_admin_pass_2025';
const TEST_USER = '_test_auth_user';
const TEST_PASS = 'mi_clave_secreta_123';
const TEST_PASS_NEW = 'clave_nueva_456';
const LEGACY_USER = '_test_legacy_user';
const LEGACY_PASS = 'legacy_plano_789';

let cookie = '';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(url, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (setCookies.length) {
    cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { ok: false, message: text };
  }
  return { res, data };
}

async function ensureAdmin() {
  const hash = await bcrypt.hash(ADMIN_PASS, 12);
  const [rows] = await pool.execute('SELECT id_usuario FROM usuarios WHERE usuario = ? LIMIT 1', [
    ADMIN_USER,
  ]);
  if (rows.length) {
    await pool.execute('UPDATE usuarios SET contrasenia = ?, rol = ? WHERE usuario = ?', [
      hash,
      'admin',
      ADMIN_USER,
    ]);
    return rows[0].id_usuario;
  }
  const [result] = await pool.execute(
    `INSERT INTO usuarios (nombre, usuario, email, contrasenia, rol)
     VALUES (?, ?, ?, ?, ?)`,
    ['Test Auth Admin', ADMIN_USER, 'auth-admin@local.dev', hash, 'admin']
  );
  return result.insertId;
}

async function cleanup() {
  await pool.execute('DELETE FROM usuarios WHERE usuario IN (?, ?, ?)', [
    ADMIN_USER,
    TEST_USER,
    LEGACY_USER,
  ]);
}

async function readStoredPassword(usuario) {
  const [rows] = await pool.execute(
    'SELECT contrasenia FROM usuarios WHERE usuario = ? LIMIT 1',
    [usuario]
  );
  return rows[0]?.contrasenia || null;
}

async function testPasswordUtils() {
  console.log('\n=== Utilidades password.js ===');
  const plain = 'secreto_prueba_99';

  assert(!isBcryptHash(plain), 'Texto plano no debe detectarse como bcrypt');
  assert(isBcryptHash('$2b$12$fac1ACGTUfHPhhYA25Wyp.YhlshSB26Yv.WGXSrBcbkesUoK7mbP6'), 'Hash bcrypt válido');

  const hash = await hashPassword(plain);
  assert(isBcryptHash(hash), 'hashPassword debe generar bcrypt');
  assert(hash !== plain, 'El hash no debe ser igual al texto plano');
  assert(await verifyPassword(plain, hash), 'verifyPassword debe aceptar contraseña correcta');
  assert(!(await verifyPassword('otra_clave', hash)), 'verifyPassword debe rechazar contraseña incorrecta');

  assert(await verifyPassword('legacy123', 'legacy123'), 'Legacy: texto plano correcto');
  assert(!(await verifyPassword('wrong', 'legacy123')), 'Legacy: texto plano incorrecto');

  const upgraded = await upgradePasswordIfLegacy(1, plain, hash);
  assert(upgraded === hash, 'No debe re-hashear si ya es bcrypt');

  const fromLegacy = await upgradePasswordIfLegacy(1, plain, plain);
  assert(isBcryptHash(fromLegacy), 'Debe migrar texto plano a bcrypt');
  assert(await verifyPassword(plain, fromLegacy), 'Hash migrado debe validar la misma clave');

  console.log('✓ Utilidades password.js');
}

async function testCreateStoresBcrypt() {
  console.log('\n=== Crear usuario guarda bcrypt ===');
  cookie = '';
  await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: ADMIN_USER, password: ADMIN_PASS },
  });

  await pool.execute('DELETE FROM usuarios WHERE usuario = ?', [TEST_USER]);
  const createRes = await request('/api/admin/usuarios', {
    method: 'POST',
    body: {
      nombre: 'Usuario Auth Test',
      usuario: TEST_USER,
      email: 'auth-test@local.dev',
      contrasena: TEST_PASS,
      rol: 'usuario',
    },
  });
  assert(createRes.res.status === 201 && createRes.data?.ok, createRes.data?.message || 'CREATE falló');

  const stored = await readStoredPassword(TEST_USER);
  assert(stored, 'Debe existir contrasenia en BD');
  assert(isBcryptHash(stored), 'createUsuario debe guardar bcrypt, no texto plano');
  assert(stored !== TEST_PASS, 'No debe guardarse la contraseña en texto plano');
  assert(await verifyPassword(TEST_PASS, stored), 'El hash guardado debe validar la contraseña');

  console.log('✓ Crear usuario guarda bcrypt');
}

async function testLoginFlow() {
  console.log('\n=== Login / logout / me ===');
  cookie = '';

  const badRes = await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: TEST_USER, password: 'clave_incorrecta' },
  });
  assert(badRes.res.status === 401, 'Contraseña incorrecta debe devolver 401');

  const meBefore = await request('/api/auth/me');
  assert(meBefore.res.status === 401, '/me sin sesión debe devolver 401');

  const okRes = await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: TEST_USER, password: TEST_PASS },
  });
  assert(okRes.res.ok && okRes.data?.ok, okRes.data?.message || 'Login correcto falló');
  assert(okRes.data.user?.usuario === TEST_USER, 'Login debe devolver el usuario correcto');

  const meRes = await request('/api/auth/me');
  assert(meRes.res.ok && meRes.data?.user?.usuario === TEST_USER, '/me debe reflejar la sesión');

  const logoutRes = await request('/api/auth/logout', { method: 'POST' });
  assert(logoutRes.res.ok && logoutRes.data?.ok, 'Logout falló');

  const meAfter = await request('/api/auth/me');
  assert(meAfter.res.status === 401, '/me tras logout debe devolver 401');

  console.log('✓ Login / logout / me');
}

async function testPasswordChangeAuth() {
  console.log('\n=== Cambio de contraseña y auth ===');
  cookie = '';
  await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: ADMIN_USER, password: ADMIN_PASS },
  });

  const [rows] = await pool.execute('SELECT id_usuario FROM usuarios WHERE usuario = ?', [TEST_USER]);
  const id = rows[0].id_usuario;

  const updateRes = await request(`/api/admin/usuarios/${id}`, {
    method: 'PUT',
    body: {
      nombre: 'Usuario Auth Test',
      usuario: TEST_USER,
      email: 'auth-test@local.dev',
      contrasena: TEST_PASS_NEW,
      rol: 'usuario',
    },
  });
  assert(updateRes.res.ok && updateRes.data?.ok, updateRes.data?.message || 'UPDATE pass falló');

  const stored = await readStoredPassword(TEST_USER);
  assert(isBcryptHash(stored), 'Tras editar debe seguir siendo bcrypt');
  assert(await verifyPassword(TEST_PASS_NEW, stored), 'Nuevo hash debe validar nueva clave');
  assert(!(await verifyPassword(TEST_PASS, stored)), 'Clave anterior no debe funcionar');

  cookie = '';
  const oldLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: TEST_USER, password: TEST_PASS },
  });
  assert(oldLogin.res.status === 401, 'Login con clave vieja debe fallar');

  const newLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: TEST_USER, password: TEST_PASS_NEW },
  });
  assert(newLogin.res.ok && newLogin.data?.ok, 'Login con clave nueva debe funcionar');

  console.log('✓ Cambio de contraseña y auth');
}

async function testLegacyMigration() {
  console.log('\n=== Migración legacy (texto plano → bcrypt) ===');
  await pool.execute('DELETE FROM usuarios WHERE usuario = ?', [LEGACY_USER]);
  await pool.execute(
    `INSERT INTO usuarios (nombre, usuario, email, contrasenia, rol)
     VALUES (?, ?, ?, ?, ?)`,
    ['Legacy User', LEGACY_USER, 'legacy@local.dev', LEGACY_PASS, 'usuario']
  );

  let stored = await readStoredPassword(LEGACY_USER);
  assert(stored === LEGACY_PASS, 'Usuario legacy debe tener texto plano');
  assert(!isBcryptHash(stored), 'Legacy no debe ser bcrypt antes del login');

  cookie = '';
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: LEGACY_USER, password: LEGACY_PASS },
  });
  assert(loginRes.res.ok && loginRes.data?.ok, loginRes.data?.message || 'Login legacy falló');

  stored = await readStoredPassword(LEGACY_USER);
  assert(isBcryptHash(stored), 'Tras login legacy debe migrarse a bcrypt');
  assert(stored !== LEGACY_PASS, 'No debe quedar texto plano en BD');
  assert(await verifyPassword(LEGACY_PASS, stored), 'Debe seguir validando la misma contraseña');

  cookie = '';
  const relogin = await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: LEGACY_USER, password: LEGACY_PASS },
  });
  assert(relogin.res.ok && relogin.data?.ok, 'Segundo login con hash migrado debe funcionar');

  console.log('✓ Migración legacy');
}

async function main() {
  console.log('Iniciando pruebas de contraseñas y autenticación…');

  await testPasswordUtils();
  await ensureAdmin();

  try {
    await fetch(`${BASE}/api/auth/me`);
  } catch {
    throw new Error(
      `No se pudo conectar a ${BASE}. Iniciá el servidor con: node src/app.js`
    );
  }

  await testCreateStoresBcrypt();
  await testLoginFlow();
  await testPasswordChangeAuth();
  await testLegacyMigration();

  await cleanup();
  await pool.end();

  console.log('\n✅ Todas las pruebas de encriptado y auth pasaron correctamente.');
}

main().catch(async (err) => {
  console.error('\n❌ FALLÓ:', err.message);
  try {
    await cleanup();
    await pool.end();
  } catch {
    /* noop */
  }
  process.exit(1);
});
