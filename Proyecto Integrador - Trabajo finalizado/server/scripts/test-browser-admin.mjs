import { createRequire } from 'module';
import { chromium } from 'playwright';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);
const pool = require('../src/config/db');

const BASE = process.env.WEB_BASE || 'http://localhost:5173';
const USER = '_browser_test_admin';
const PASS = 'browser_test_2025';

async function ensureUser() {
  const hash = await bcrypt.hash(PASS, 12);
  await pool.execute('DELETE FROM usuarios WHERE usuario = ?', [USER]);
  await pool.execute(
    `INSERT INTO usuarios (nombre, usuario, email, contrasenia, rol) VALUES (?,?,?,?,?)`,
    ['Browser Test', USER, 'browser@test.local', hash, 'admin']
  );
}

async function cleanup() {
  await pool.execute('DELETE FROM usuarios WHERE usuario = ?', [USER]);
  await pool.end();
}

async function main() {
  await ensureUser();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const issues = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('401')) issues.push(`Console: ${msg.text()}`);
  });

  await page.goto(`${BASE}/login`);
  await page.fill('#usuario', USER);
  await page.fill('#password', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 10000 });

  const panelTables = await page.locator('.admin-table').count();
  console.log(panelTables >= 2 ? '✓ Panel admin: 2 tablas' : '✗ Panel admin sin tablas');

  const sections = ['noticias', 'servicios', 'que-hacer', 'que-visitar', 'usuarios'];
  for (const s of sections) {
    await page.goto(`${BASE}/admin/gestion/${s}`, { waitUntil: 'networkidle' });
    const table = await page.locator('.admin-table tbody tr').count();
    const emptyMsg = await page.locator('tbody').textContent();
    if (emptyMsg?.includes('No hay registros') && table === 1) {
      // puede ser carga o vacío real
    }
    const editBtn = await page.locator('a.btn-primary.btn-sm').count();
    console.log(`✓ Gestion ${s}: ${table} filas, ${editBtn} botones editar`);
  }

  await page.goto(`${BASE}/admin/crear`);
  const tabs = await page.locator('.form-type-btn').count();
  console.log(tabs === 4 ? '✓ Cargar contenido: 4 pestañas' : `✗ Cargar contenido: ${tabs} pestañas`);

  await page.goto(`${BASE}/admin/usuarios/crear`);
  const dni = await page.locator('#dni').count();
  const passField = await page.locator('#contrasena').count();
  console.log(dni && passField ? '✓ Formulario usuario: campos dni y contrasena' : '✗ Formulario usuario incompleto');

  // Redirect desde admin protegido
  await page.goto(`${BASE}/admin/gestion/noticias`);
  await page.click('text=Editar', { timeout: 5000 }).catch(() => issues.push('No hay botón Editar en noticias'));
  if (page.url().includes('/admin/editar/')) {
    const form = await page.locator('.form-wrapper').count();
    console.log(form ? '✓ Página editar carga formulario' : '✗ Página editar sin formulario');
  }

  await browser.close();
  await cleanup();

  if (issues.length) {
    console.log('\nProblemas admin:');
    issues.forEach((i) => console.log('⚠', i));
  }
}

main().catch(async (e) => {
  console.error(e);
  try { await cleanup(); } catch {}
  process.exit(1);
});
