/**
 * Mueve HTML/JS/CSS legacy de public_html/ a _archivo_html/ (backup).
 * Conserva img/ y bd/ intactos — las subidas siguen en public_html/img.
 *
 * Uso:
 *   node scripts/archive-legacy-html.js          # dry-run
 *   node scripts/archive-legacy-html.js --apply  # mover archivos
 */
const fs = require('fs');
const path = require('path');
const { publicHtmlPath } = require('../src/config/paths');

const apply = process.argv.includes('--apply');
const archiveRoot = path.join(publicHtmlPath, '_archivo_html');

const MOVE_PATTERNS = [
  '*.html',
  'style.css',
  'js',
  'gestion',
  'editar',
  'detalles',
];

function collectEntries() {
  const entries = [];

  const rootHtml = fs.readdirSync(publicHtmlPath).filter((name) => name.endsWith('.html'));
  rootHtml.forEach((name) => entries.push({ from: path.join(publicHtmlPath, name), rel: name }));

  const styleCss = path.join(publicHtmlPath, 'style.css');
  if (fs.existsSync(styleCss)) {
    entries.push({ from: styleCss, rel: 'style.css' });
  }

  ['js', 'gestion', 'editar', 'detalles'].forEach((dirName) => {
    const dirPath = path.join(publicHtmlPath, dirName);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      entries.push({ from: dirPath, rel: dirName, isDir: true });
    }
  });

  return entries;
}

function main() {
  console.log(`Origen: ${publicHtmlPath}`);
  console.log(`Destino backup: ${archiveRoot}`);
  console.log(apply ? 'Modo: APLICAR movimientos\n' : 'Modo: dry-run (agregá --apply para mover)\n');

  const entries = collectEntries();
  if (!entries.length) {
    console.log('No hay archivos HTML legacy para archivar.');
    return;
  }

  entries.forEach(({ from, rel, isDir }) => {
    const dest = path.join(archiveRoot, rel);
    console.log(`${isDir ? '[dir]' : '[file]'} ${rel} -> _archivo_html/${rel}`);
    if (!apply) return;

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(from, dest);
  });

  if (apply) {
    console.log(`\n${entries.length} elemento(s) archivados. img/ no fue modificado.`);
  } else {
    console.log(`\n${entries.length} elemento(s) listos para archivar. Ejecutá con --apply.`);
  }
}

main();
