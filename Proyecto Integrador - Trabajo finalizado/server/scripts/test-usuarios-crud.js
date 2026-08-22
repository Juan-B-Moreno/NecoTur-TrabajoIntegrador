/**
 * Prueba crear, editar y eliminar usuarios vía API admin.
 * Uso: node scripts/test-usuarios-crud.js
 * Requiere servidor en http://localhost:3000 y MySQL activo.
 */
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const BASE = process.env.API_BASE || 'http://localhost:3000';
const ADMIN_USER = '_test_users_admin';
const ADMIN_PASS = 'test_users_admin_2025';
const TARGET_USER = '_test_target_user';
const TARGET_PASS = 'target_pass_2025';
const TARGET_PASS_NEW = 'target_pass_new_2025';

let cookie = '';

async function request(url, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
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
    await pool.execute(
      'UPDATE usuarios SET contrasenia = ?, rol = ? WHERE usuario = ?',
      [hash, 'admin', ADMIN_USER]
    );
    return rows[0].id_usuario;
  }
  const [result] = await pool.execute(
    `INSERT INTO usuarios (nombre, usuario, email, dni, contrasenia, rol)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Test Users Admin', ADMIN_USER, 'test-users-admin@local.dev', null, hash, 'admin']
  );
  return result.insertId;
}

async function cleanupDb() {
  await pool.execute('DELETE FROM usuarios WHERE usuario IN (?, ?)', [ADMIN_USER, TARGET_USER]);
}

async function login(usuario, password) {
  cookie = '';
  const { res, data } = await request('/api/auth/login', {
    method: 'POST',
    body: { usuario, password },
  });
  if (!res.ok || !data?.ok) throw new Error(data?.message || `Login falló (${res.status})`);
  return data.user;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log('Preparando admin de prueba…');
  const adminId = await ensureAdmin();
  await pool.execute('DELETE FROM usuarios WHERE usuario = ?', [TARGET_USER]);

  console.log('Iniciando sesión como admin…');
  await login(ADMIN_USER, ADMIN_PASS);

  const results = [];

  // CREATE
  process.stdout.write('Crear usuario… ');
  const createRes = await request('/api/admin/usuarios', {
    method: 'POST',
    body: {
      nombre: 'Usuario Prueba CRUD',
      usuario: TARGET_USER,
      email: 'test-target@local.dev',
      dni: '99999999',
      contrasena: TARGET_PASS,
      rol: 'usuario',
    },
  });
  assert(createRes.res.status === 201 && createRes.data?.ok, createRes.data?.message || 'CREATE falló');
  const targetId = createRes.data.id;
  results.push({ test: 'crear', ok: true, status: createRes.res.status, id: targetId });
  console.log('OK');

  // LIST
  process.stdout.write('Listar usuarios… ');
  const listRes = await request('/api/admin/usuarios');
  assert(listRes.res.ok && listRes.data?.ok, listRes.data?.message || 'LIST falló');
  const listed = (listRes.data.usuarios || []).find((u) => u.id_usuario === targetId);
  assert(listed, 'El usuario creado no aparece en el listado');
  results.push({ test: 'listar', ok: true, status: listRes.res.status });
  console.log('OK');

  // GET
  process.stdout.write('Obtener usuario… ');
  const getRes = await request(`/api/admin/usuarios/${targetId}`);
  assert(getRes.res.ok && getRes.data?.ok, getRes.data?.message || 'GET falló');
  assert(getRes.data.usuario.usuario === TARGET_USER, 'GET devolvió usuario incorrecto');
  results.push({ test: 'obtener', ok: true, status: getRes.res.status });
  console.log('OK');

  // UPDATE sin contraseña
  process.stdout.write('Editar usuario (sin contraseña)… ');
  const updateRes = await request(`/api/admin/usuarios/${targetId}`, {
    method: 'PUT',
    body: {
      nombre: 'Usuario Prueba Editado',
      usuario: TARGET_USER,
      email: 'test-target-edit@local.dev',
      dni: '88888888',
      rol: 'usuario',
    },
  });
  assert(updateRes.res.ok && updateRes.data?.ok, updateRes.data?.message || 'UPDATE falló');
  const getAfterEdit = await request(`/api/admin/usuarios/${targetId}`);
  assert(getAfterEdit.data.usuario.nombre === 'Usuario Prueba Editado', 'Nombre no actualizado');
  assert(getAfterEdit.data.usuario.email === 'test-target-edit@local.dev', 'Email no actualizado');
  assert(getAfterEdit.data.usuario.dni === '88888888', 'DNI no actualizado');
  results.push({ test: 'editar_sin_pass', ok: true, status: updateRes.res.status });
  console.log('OK');

  // UPDATE con contraseña
  process.stdout.write('Editar contraseña… ');
  const passRes = await request(`/api/admin/usuarios/${targetId}`, {
    method: 'PUT',
    body: {
      nombre: 'Usuario Prueba Editado',
      usuario: TARGET_USER,
      email: 'test-target-edit@local.dev',
      dni: '88888888',
      contrasena: TARGET_PASS_NEW,
      rol: 'usuario',
    },
  });
  assert(passRes.res.ok && passRes.data?.ok, passRes.data?.message || 'UPDATE pass falló');
  results.push({ test: 'editar_con_pass', ok: true, status: passRes.res.status });
  console.log('OK');

  // No puede eliminar la propia cuenta
  process.stdout.write('Bloqueo eliminar propia cuenta… ');
  const selfDelRes = await request(`/api/admin/usuarios/${adminId}`, { method: 'DELETE' });
  assert(selfDelRes.res.status === 400, 'Debería rechazar eliminar la propia cuenta');
  assert(
    selfDelRes.data?.message?.includes('propia'),
    `Mensaje inesperado: ${selfDelRes.data?.message}`
  );
  results.push({ test: 'bloqueo_auto_eliminar', ok: true, status: selfDelRes.res.status });
  console.log('OK');

  // DELETE usuario de prueba
  process.stdout.write('Eliminar usuario… ');
  const delRes = await request(`/api/admin/usuarios/${targetId}`, { method: 'DELETE' });
  assert(delRes.res.ok && delRes.data?.ok, delRes.data?.message || 'DELETE falló');
  const goneRes = await request(`/api/admin/usuarios/${targetId}`);
  assert(goneRes.res.status === 404, 'El usuario sigue existiendo tras DELETE');
  results.push({ test: 'eliminar', ok: true, status: delRes.res.status });
  console.log('OK');

  await request('/api/auth/logout', { method: 'POST' });
  await cleanupDb();
  await pool.end();

  console.log('\n--- Resumen ---');
  results.forEach((r) => {
    console.log(`✓ ${r.test}: ${r.status}${r.id ? ` (id ${r.id})` : ''}`);
  });
  console.log('\nTodas las pruebas de editar/eliminar usuarios pasaron.');
}

main().catch(async (err) => {
  console.error('\nFALLÓ:', err.message);
  try {
    await cleanupDb();
    await pool.end();
  } catch {
    /* noop */
  }
  process.exit(1);
});
