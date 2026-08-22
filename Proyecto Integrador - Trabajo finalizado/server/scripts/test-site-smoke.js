/**
 * Smoke test de rutas públicas y API.
 * Uso: node scripts/test-site-smoke.js
 */
const BASE_API = process.env.API_BASE || 'http://localhost:3000';
const BASE_WEB = process.env.WEB_BASE || 'http://localhost:5173';

const PUBLIC_ROUTES = ['/', '/hub', '/noticias', '/servicios', '/que-hacer', '/que-visitar', '/login'];
const API_PUBLIC = [
  '/api/public/noticias?limit=3',
  '/api/public/servicios?limit=3',
  '/api/public/que-hacer?limit=3',
  '/api/public/que-visitar?limit=3',
  '/api/public/clima',
];

async function check(url, label) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const ok = res.status >= 200 && res.status < 400;
    const text = await res.text();
    const hasRoot = url.startsWith(BASE_WEB) ? text.includes('id="root"') || text.includes('Necochea') : true;
    return { label, url, ok: ok && hasRoot, status: res.status, detail: !hasRoot ? 'HTML sin contenido esperado' : '' };
  } catch (err) {
    return { label, url, ok: false, status: 0, detail: err.message };
  }
}

async function main() {
  console.log('Smoke test sitio React + API\n');
  const results = [];

  for (const path of PUBLIC_ROUTES) {
    results.push(await check(`${BASE_WEB}${path}`, `SPA ${path}`));
  }
  for (const path of API_PUBLIC) {
    results.push(await check(`${BASE_API}${path}`, `API ${path}`));
  }

  // Detalle dinámico si hay noticias
  try {
    const res = await fetch(`${BASE_API}/api/public/noticias?limit=1`);
    const data = await res.json();
    const first = data?.noticias?.[0];
    if (first?.id) {
      results.push(await check(`${BASE_WEB}/detalle/noticia/${first.id}`, `SPA detalle noticia`));
      results.push(await check(`${BASE_API}/api/public/noticias/${first.id}`, `API detalle noticia`));
    }
  } catch {
    results.push({ label: 'Detalle noticia', ok: false, detail: 'No se pudo obtener noticia de prueba' });
  }

  results.forEach((r) => {
    const icon = r.ok ? '✓' : '✗';
    console.log(`${icon} ${r.label} [${r.status || '-'}] ${r.detail || ''}`);
  });

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log(`\n${failed.length} fallo(s).`);
    process.exit(1);
  }
  console.log('\nSmoke test OK.');
}

main();
