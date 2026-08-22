import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE || 'http://localhost:5173';
const results = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${BASE}/noticias`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  const url1 = page.url();
  const cards1 = await page.locator('a.news-card').count();
  const firstId1 = await page.locator('a.news-card').first().getAttribute('href');
  const pagVisible = await page.locator('.pagination').isVisible();
  const btn2 = page.locator('.pagination .page-btn', { hasText: '2' });

  results.push(['Paginacion visible', pagVisible]);
  results.push(['Pagina 1 tiene cards', cards1 > 0]);

  if (await btn2.count()) {
    await btn2.first().click();
    await page.waitForTimeout(1200);
    const url2 = page.url();
    const cards2 = await page.locator('a.news-card').count();
    const firstId2 = await page.locator('a.news-card').first().getAttribute('href');
    results.push(['URL cambia a page=2', url2.includes('page=2')]);
    results.push(['Cards pagina 2', cards2 > 0]);
    results.push(['Contenido distinto', firstId1 !== firstId2]);
  } else {
    results.push(['Boton pagina 2 existe', false]);
  }

  const nextBtn = page.locator('.pagination .page-btn.arrow', { hasText: '›' });
  if (await nextBtn.count()) {
    await page.goto(`${BASE}/noticias`);
    await page.waitForLoadState('networkidle');
    await nextBtn.first().click();
    await page.waitForTimeout(1200);
    results.push(['Siguiente cambia URL', page.url().includes('page=2')]);
  }
} finally {
  await browser.close();
}

for (const [msg, ok] of results) console.log(`${ok ? 'OK' : 'FAIL'}: ${msg}`);
const failed = results.filter(([, ok]) => !ok);
process.exit(failed.length ? 1 : 0);
