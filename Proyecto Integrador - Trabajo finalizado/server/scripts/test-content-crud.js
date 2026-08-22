/**
 * Prueba crear, editar y eliminar publicaciones vía API.
 * Uso: node scripts/test-content-crud.js
 * Requiere servidor en http://localhost:3000 y MySQL activo.
 */
const fs = require('fs');
const path = require('path');
const { Blob } = require('buffer');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const BASE = process.env.API_BASE || 'http://localhost:3000';
const TEST_USER = '_test_crud_admin';
const TEST_PASS = 'test_crud_pass_2025';
const IMAGE_PATH = path.join(
  __dirname,
  '../../public_html/img/Fondos/cartel_neco.jpg'
);

let cookie = '';

async function request(url, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !(options.body instanceof FormData)) {
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

function buildForm(fields, withImage = true) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v != null && v !== '') fd.append(k, String(v));
  });
  if (withImage) {
    const buf = fs.readFileSync(IMAGE_PATH);
    fd.append('imagenes', new Blob([buf], { type: 'image/jpeg' }), 'test.jpg');
  }
  return fd;
}

async function ensureTestUser() {
  const hash = await bcrypt.hash(TEST_PASS, 12);
  const [rows] = await pool.execute('SELECT id_usuario FROM usuarios WHERE usuario = ? LIMIT 1', [
    TEST_USER,
  ]);
  if (rows.length) {
    await pool.execute(
      'UPDATE usuarios SET contrasenia = ?, rol = ? WHERE usuario = ?',
      [hash, 'admin', TEST_USER]
    );
    return rows[0].id_usuario;
  }
  const [result] = await pool.execute(
    `INSERT INTO usuarios (nombre, usuario, email, dni, contrasenia, rol)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Test CRUD', TEST_USER, 'test-crud@local.dev', null, hash, 'admin']
  );
  return result.insertId;
}

async function removeTestUser() {
  await pool.execute('DELETE FROM usuarios WHERE usuario = ?', [TEST_USER]);
}

async function login() {
  const { res, data } = await request('/api/auth/login', {
    method: 'POST',
    body: { usuario: TEST_USER, password: TEST_PASS },
  });
  if (!res.ok || !data?.ok) throw new Error(data?.message || `Login falló (${res.status})`);
}

const CONTENT_TYPES = [
  {
    name: 'noticia',
    listUrl: '/api/noticias',
    listKey: 'noticias',
    itemKey: 'noticia',
    idField: 'id_noticia',
    createFields: {
      titulo: 'Test noticia CRUD',
      descripcion: 'Descripción de prueba automatizada',
      contenido: 'Contenido completo de prueba',
      fecha: '2026-05-27',
      lugar: 'Necochea',
      filtros: JSON.stringify(['Necochea']),
    },
    updateFields: {
      titulo: 'Test noticia CRUD editada',
      descripcion: 'Descripción editada por script',
      contenido: 'Contenido editado',
      fecha: '2026-05-28',
      lugar: 'Quequén',
      filtros: JSON.stringify(['Quequen']),
    },
  },
  {
    name: 'servicio',
    listUrl: '/api/servicios',
    listKey: 'servicios',
    itemKey: 'servicio',
    idField: 'id_servicio',
    createFields: {
      nombre: 'Test servicio CRUD',
      descripcion: 'Servicio de prueba',
      info: 'Info de prueba',
      contacto: '02262-000000',
      filtros: JSON.stringify(['Hoteles']),
    },
    updateFields: {
      nombre: 'Test servicio CRUD editado',
      descripcion: 'Servicio editado',
      info: 'Info editada',
      contacto: '02262-111111',
      filtros: JSON.stringify(['Restaurantes']),
    },
  },
  {
    name: 'que_hacer',
    listUrl: '/api/que-hacer',
    listKey: 'actividades',
    itemKey: 'actividad',
    idField: 'id_servicio',
    createFields: {
      nombre: 'Test actividad CRUD',
      descripcion: 'Actividad de prueba',
      info: 'Detalle actividad',
      contacto: '02262-222222',
    },
    updateFields: {
      nombre: 'Test actividad CRUD editada',
      descripcion: 'Actividad editada',
      info: 'Detalle editado',
      contacto: '02262-333333',
    },
  },
  {
    name: 'que_visitar',
    listUrl: '/api/que-visitar',
    listKey: 'lugares',
    itemKey: 'lugar',
    idField: 'id_lugar',
    createFields: {
      nombre: 'Test lugar CRUD',
      descripcion: 'Lugar de prueba',
      informacion: 'Información del lugar',
      contacto: '02262-444444',
    },
    updateFields: {
      nombre: 'Test lugar CRUD editado',
      descripcion: 'Lugar editado',
      informacion: 'Información editada',
      contacto: '02262-555555',
    },
  },
];

async function testType(cfg) {
  const results = { tipo: cfg.name, create: null, get: null, update: null, delete: null, id: null };

  const createRes = await request(cfg.listUrl, {
    method: 'POST',
    body: buildForm(cfg.createFields),
  });
  results.create = createRes.res.status;
  if (!createRes.res.ok || !createRes.data?.ok) {
    throw new Error(`${cfg.name} CREATE: ${createRes.data?.message || createRes.res.status}`);
  }
  results.id = createRes.data.id;

  const getRes = await request(`${cfg.listUrl}/${results.id}`);
  results.get = getRes.res.status;
  if (!getRes.res.ok || !getRes.data?.ok || !getRes.data[cfg.itemKey]) {
    throw new Error(`${cfg.name} GET: ${getRes.data?.message || getRes.res.status}`);
  }

  const updateRes = await request(`${cfg.listUrl}/${results.id}`, {
    method: 'PUT',
    body: buildForm(cfg.updateFields, false),
  });
  results.update = updateRes.res.status;
  if (!updateRes.res.ok || !updateRes.data?.ok) {
    throw new Error(`${cfg.name} UPDATE: ${updateRes.data?.message || updateRes.res.status}`);
  }

  const deleteRes = await request(`${cfg.listUrl}/${results.id}`, { method: 'DELETE' });
  results.delete = deleteRes.res.status;
  if (!deleteRes.res.ok || !deleteRes.data?.ok) {
    throw new Error(`${cfg.name} DELETE: ${deleteRes.data?.message || deleteRes.res.status}`);
  }

  const goneRes = await request(`${cfg.listUrl}/${results.id}`);
  if (goneRes.res.status !== 404) {
    throw new Error(`${cfg.name}: el registro sigue existiendo tras DELETE`);
  }

  return results;
}

async function main() {
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`No se encontró imagen de prueba: ${IMAGE_PATH}`);
  }

  console.log('Preparando usuario de prueba…');
  await ensureTestUser();

  console.log('Iniciando sesión…');
  await login();

  const summary = [];
  for (const cfg of CONTENT_TYPES) {
    process.stdout.write(`Probando ${cfg.name}… `);
    try {
      const r = await testType(cfg);
      summary.push({ ...r, ok: true });
      console.log('OK');
    } catch (err) {
      summary.push({ tipo: cfg.name, ok: false, error: err.message });
      console.log('FALLÓ');
      console.error(`  → ${err.message}`);
    }
  }

  await request('/api/auth/logout', { method: 'POST' });
  await removeTestUser();
  await pool.end();

  console.log('\n--- Resumen ---');
  summary.forEach((s) => {
    if (s.ok) {
      console.log(`✓ ${s.tipo}: create=${s.create} get=${s.get} update=${s.update} delete=${s.delete} (id ${s.id})`);
    } else {
      console.log(`✗ ${s.tipo}: ${s.error}`);
    }
  });

  const failed = summary.filter((s) => !s.ok);
  if (failed.length) process.exit(1);
  console.log('\nTodas las pruebas de editar/eliminar publicaciones pasaron.');
}

main().catch(async (err) => {
  console.error('\nError fatal:', err.message);
  try {
    await removeTestUser();
    await pool.end();
  } catch {
    /* noop */
  }
  process.exit(1);
});
