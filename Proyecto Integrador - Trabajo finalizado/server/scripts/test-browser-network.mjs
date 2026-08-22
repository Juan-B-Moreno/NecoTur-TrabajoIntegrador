import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE || 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const failed = [];

  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    if (status >= 400 && !url.includes('/api/auth/me')) {
      failed.push({ status, url });
    }
  });

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.goto(`${BASE}/noticias`, { waitUntil: 'networkidle' });
  const link = page.locator('a.news-card').first();
  if (await link.count()) {
    const href = await link.getAttribute('href');
    await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const title = await page.locator('.detail-title-text').textContent();
    console.log('Detalle título:', title);
    console.log('Document title:', await page.title());
  }

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });

  console.log('\nRecursos con error (excl. /me):');
  failed.forEach((f) => console.log(`  ${f.status} ${f.url}`));

  await browser.close();
}

main();
