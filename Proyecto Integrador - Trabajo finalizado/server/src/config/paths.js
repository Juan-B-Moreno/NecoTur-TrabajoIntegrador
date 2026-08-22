/*
  paths.js
  ----------------
  Rutas del proyecto en disco (servidor Node, sitio estático e imágenes).
  - Expone `serverRoot`, `projectRoot`, `publicHtmlPath` y `frontendDistPath`.
  - `publicHtmlPath`: carpeta con /img (subidas y assets estáticos).
  - `frontendDistPath`: build de React (`proyecto-migrado-react/dist`).
  - Consumido por `app.js` y utilidades de subida de imágenes.
*/

const fs = require('fs');
const path = require('path');

// Carpeta `server/` (donde está package.json del backend)
const serverRoot = path.join(__dirname, '../..');
// Raiz del repo (padre de server y public_html)
const projectRoot = path.join(serverRoot, '..');

// Determina la ruta absoluta de public_html (o equivalente legacy WireFrame)
function resolvePublicHtmlPath() {
  if (process.env.PUBLIC_HTML_PATH) {
    return path.resolve(process.env.PUBLIC_HTML_PATH);
  }

  const publicHtml = path.join(projectRoot, 'public_html');
  const legacyWireFrame = path.join(projectRoot, 'WireFrame');

  if (fs.existsSync(publicHtml)) return publicHtml;
  if (fs.existsSync(legacyWireFrame)) return legacyWireFrame;

  return publicHtml;
}

function resolveFrontendDistPath() {
  if (process.env.FRONTEND_DIST_PATH === '' || process.env.USE_SPA === '0') {
    return null;
  }

  if (process.env.FRONTEND_DIST_PATH) {
    return path.resolve(process.env.FRONTEND_DIST_PATH);
  }

  return path.join(projectRoot, 'proyecto-migrado-react', 'dist');
}

function isSpaEnabled() {
  if (process.env.USE_SPA === '0' || process.env.USE_SPA === 'false') {
    return false;
  }

  const distPath = resolveFrontendDistPath();
  if (!distPath) return false;

  return fs.existsSync(path.join(distPath, 'index.html'));
}

// Rutas resueltas una vez al arrancar el proceso.
const publicHtmlPath = resolvePublicHtmlPath();
const frontendDistPath = resolveFrontendDistPath();
const spaEnabled = isSpaEnabled();

module.exports = {
  serverRoot,
  projectRoot,
  publicHtmlPath,
  frontendDistPath,
  spaEnabled,
};
