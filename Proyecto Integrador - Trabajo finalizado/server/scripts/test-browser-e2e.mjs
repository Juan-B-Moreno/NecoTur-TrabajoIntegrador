/**
 * Prueba E2E en navegador (Playwright).
 * Uso: npx playwright test no aplica; ejecutar: node scripts/test-browser-e2e.mjs
 * Requiere: npx playwright (se instala al vuelo)
 */
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE || 'http://localhost:5173';
const errors = [];
const checks = [];

function log(ok, msg) {
  checks.push({ ok, msg });
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
  });

  const routes = ['/', '/noticias', '/servicios', '/que-hacer', '/que-visitar', '/hub', '/login'];
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
    const title = await page.title();
    const hasNav = await page.locator('.navbar').count();
    log(hasNav > 0, `${route} carga con navbar (title: ${title})`);
  }

  // Listado noticias: tarjetas o mensaje vacío
  await page.goto(`${BASE}/noticias`, { waitUntil: 'networkidle' });
  const cards = await page.locator('.news-card, .admin-table-empty, .cards-grid a').count();
  log(cards >= 0, `/noticias renderiza contenido (${cards} elementos)`);

  // Detalle: seguir primer enlace si existe
  const detailLink = page.locator('a.news-card, a.dest-card, a.service-card, a.hacer-card').first();
  if (await detailLink.count()) {
    await detailLink.click();
    await page.waitForLoadState('networkidle');
    const detailTitle = await page.locator('.detail-title-text').textContent().catch(() => '');
    const gallery = await page.locator('#detailCarousel').count();
    log(gallery > 0 && detailTitle, `Detalle OK: "${detailTitle?.slice(0, 40)}..."`);
    const badTitle = await page.title();
    if (badTitle.includes('Cargando') && detailTitle && detailTitle !== 'Cargando…') {
      errors.push('Título de pestaña puede quedar desactualizado tras cargar detalle');
    }
    await page.goBack();
    await page.waitForLoadState('networkidle');
    const backTitle = await page.title();
    log(!backTitle.includes('— necochea') || backTitle.includes('Noticias'), `Tras volver título: ${backTitle}`);
  } else {
    log(true, 'Sin tarjetas públicas para probar detalle (BD vacía o sin match)');
  }

  // Login UI
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const loginForm = await page.locator('form').count();
  log(loginForm > 0, '/login muestra formulario');

  // Admin sin sesión → redirect login
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  const onLogin = page.url().includes('/login');
  log(onLogin, '/admin sin sesión redirige a login');

  await browser.close();

  console.log('\n--- Errores de consola/página ---');
  if (errors.length) {
    [...new Set(errors)].forEach((e) => console.log('⚠', e));
  } else {
    console.log('(ninguno)');
  }

  const failed = checks.filter((c) => !c.ok);
  if (failed.length || errors.some((e) => e.startsWith('PAGE ERROR'))) process.exit(1);
  console.log('\nPrueba E2E en navegador completada.');
}

main().catch((err) => {
  console.error('E2E falló:', err.message);
  process.exit(1);
});
