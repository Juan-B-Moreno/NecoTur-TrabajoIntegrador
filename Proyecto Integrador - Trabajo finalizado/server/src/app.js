const path = require('path');
const fs = require('fs');

// Carga .env desde server/ aunque el proceso se inicie desde otra carpeta (PM2, hosting, etc.)
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const noticiasRoutes = require('./routes/noticias.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const queHacerRoutes = require('./routes/queHacer.routes');
const queVisitarRoutes = require('./routes/queVisitar.routes');
const publicRoutes = require('./routes/public.routes');
const { requireRole, requirePanelUser } = require('./middleware/auth');
const { publicHtmlPath, frontendDistPath, spaEnabled } = require('./config/paths');
const { startClimaRefreshJob } = require('./controllers/clima.controller');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
const SESSION_MAX_AGE =
  (Number(process.env.SESSION_MAX_AGE_MINUTES) || 5) * 60 * 1000;

const LEGACY_HTML_REDIRECTS = {
  '/index.html': '/',
  '/hub.html': '/hub',
  '/noticias.html': '/noticias',
  '/servicios.html': '/servicios',
  '/que-hacer.html': '/que-hacer',
  '/que-visitar.html': '/que-visitar',
  '/formulario_login.html': '/login',
  '/panel_admin.html': '/admin',
  '/formulario_admin.html': '/admin/crear',
  '/formulario_user.html': '/usuario/crear',
  '/crear-usuario.html': '/admin/usuarios/crear',
  '/gestion/gestionar-noticias.html': '/admin/gestion/noticias',
  '/gestion/gestionar-servicios.html': '/admin/gestion/servicios',
  '/gestion/gestionar-que-hacer.html': '/admin/gestion/que-hacer',
  '/gestion/gestionar-que-visitar.html': '/admin/gestion/que-visitar',
  '/gestion/gestionar-usuarios.html': '/admin/gestion/usuarios',
  '/gestion/gestionar-mis-noticias.html': '/usuario/mis-noticias',
};

const LEGACY_EDITAR_PREFIX = {
  '/editar/editar-noticia.html': '/admin/editar/noticia',
  '/editar/editar-servicio.html': '/admin/editar/servicio',
  '/editar/editar-que-hacer.html': '/admin/editar/que_hacer',
  '/editar/editar-que-visitar.html': '/admin/editar/que_visitar',
  '/editar/editar-usuario.html': '/admin/usuarios/editar',
};

const LEGACY_DETALLE_PREFIX = {
  '/detalles/detalle-noticias.html': '/detalle/noticia',
  '/detalles/detalle-servicios.html': '/detalle/servicio',
  '/detalles/detalle-que-hacer.html': '/detalle/que_hacer',
  '/detalles/detalle-que-visitar.html': '/detalle/que_visitar',
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'necotur_dev_secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      sameSite: 'lax',
    },
  })
);

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/que-hacer', queHacerRoutes);
app.use('/api/que-visitar', queVisitarRoutes);

function sendPublicFile(res, filename) {
  res.sendFile(path.join(publicHtmlPath, filename));
}

function registerLegacyHtmlGuards() {
  app.get('/panel_admin.html', requireRole('admin'), (req, res) => {
    sendPublicFile(res, 'panel_admin.html');
  });

  app.get('/formulario_admin.html', requireRole('admin'), (req, res) => {
    sendPublicFile(res, 'formulario_admin.html');
  });

  app.get('/formulario_user.html', requirePanelUser, (req, res) => {
    sendPublicFile(res, 'formulario_user.html');
  });

  app.get('/crear-usuario.html', requireRole('admin'), (req, res) => {
    sendPublicFile(res, 'crear-usuario.html');
  });

  const gestionAdminPages = [
    'gestionar-noticias.html',
    'gestionar-servicios.html',
    'gestionar-que-hacer.html',
    'gestionar-que-visitar.html',
    'gestionar-usuarios.html',
  ];
  gestionAdminPages.forEach((page) => {
    app.get(`/gestion/${page}`, requireRole('admin'), (req, res) => {
      sendPublicFile(res, `gestion/${page}`);
    });
  });

  app.get('/gestion/gestionar-mis-noticias.html', requirePanelUser, (req, res) => {
    sendPublicFile(res, 'gestion/gestionar-mis-noticias.html');
  });

  const editarPages = [
    { file: 'editar-noticia.html', guard: requirePanelUser },
    { file: 'editar-usuario.html', guard: requireRole('admin') },
    { file: 'editar-servicio.html', guard: requireRole('admin') },
    { file: 'editar-que-hacer.html', guard: requireRole('admin') },
    { file: 'editar-que-visitar.html', guard: requireRole('admin') },
  ];
  editarPages.forEach(({ file, guard }) => {
    app.get(`/editar/${file}`, guard, (req, res) => {
      sendPublicFile(res, `editar/${file}`);
    });
  });
}

function registerLegacyRedirects() {
  Object.entries(LEGACY_HTML_REDIRECTS).forEach(([from, to]) => {
    app.get(from, (req, res) => {
      res.redirect(301, to);
    });
  });

  Object.entries(LEGACY_EDITAR_PREFIX).forEach(([from, prefix]) => {
    app.get(from, (req, res) => {
      const id = req.query.id;
      if (!id) return res.redirect(301, prefix.replace(/\/[^/]+$/, ''));
      return res.redirect(301, `${prefix}/${encodeURIComponent(id)}`);
    });
  });

  Object.entries(LEGACY_DETALLE_PREFIX).forEach(([from, prefix]) => {
    app.get(from, (req, res) => {
      const id = req.query.id;
      if (!id) return res.redirect(301, '/');
      return res.redirect(301, `${prefix}/${encodeURIComponent(id)}`);
    });
  });
}

function registerSpaStatic() {
  const imgPath = path.join(publicHtmlPath, 'img');
  if (fs.existsSync(imgPath)) {
    app.use('/img', express.static(imgPath));
  } else {
    console.warn(`Advertencia: no existe carpeta de imágenes en ${imgPath}`);
  }

  registerLegacyRedirects();

  app.use(
    express.static(frontendDistPath, {
      index: false,
      fallthrough: true,
    })
  );

  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

function registerLegacyStatic() {
  registerLegacyHtmlGuards();

  app.use(
    express.static(publicHtmlPath, {
      index: 'index.html',
    })
  );
}

app.use((req, res, next) => {
  const blocked =
    req.path.startsWith('/bd') ||
    req.path.includes('.env') ||
    req.path.endsWith('.sql');
  if (blocked) {
    return res.status(404).send('Not found');
  }
  next();
});

if (spaEnabled) {
  registerSpaStatic();
} else {
  registerLegacyStatic();
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Error interno del servidor');
});

app.listen(PORT, async () => {
  startClimaRefreshJob();
  console.log(`Necochea Turismo — http://localhost:${PORT}`);

  if (spaEnabled) {
    console.log(`Modo SPA (React): ${frontendDistPath}`);
    console.log(`Imágenes /img: ${path.join(publicHtmlPath, 'img')}`);
    console.log(`Login: http://localhost:${PORT}/login`);
  } else {
    console.log(`Modo HTML legacy: ${publicHtmlPath}`);
    console.log(`Login: http://localhost:${PORT}/formulario_login.html`);
    if (frontendDistPath && !fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
      console.warn(
        `Build React no encontrado en ${frontendDistPath}. Ejecutá: cd proyecto-migrado-react && npm run build`
      );
    }
  }

  try {
    const pool = require('./config/db');
    const { ensureMovimientosTable } = require('./utils/auditLog');
    const { ensureFiltrosCatalogoTable } = require('./utils/filtrosCatalogo');
    await pool.execute('SELECT 1');
    await ensureMovimientosTable();
    await ensureFiltrosCatalogoTable();
    console.log(`MySQL conectado: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'necotur'}`);
  } catch (err) {
    console.error('ERROR MySQL al iniciar:', err.code || '', err.message);
  }
});
