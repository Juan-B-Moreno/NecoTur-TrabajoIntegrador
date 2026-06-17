const path = require('path');

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
const { publicHtmlPath } = require('./config/paths');
const { startClimaRefreshJob } = require('./controllers/clima.controller');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'necotur_dev_secret',
    resave: false,
    saveUninitialized: false,
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

app.use(
  express.static(publicHtmlPath, {
    index: 'index.html',
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Error interno del servidor');
});

app.listen(PORT, async () => {
  startClimaRefreshJob();
  console.log(`Necochea Turismo — http://localhost:${PORT}`);
  console.log(`Sitio estático: ${publicHtmlPath}`);
  console.log(`Login: http://localhost:${PORT}/formulario_login.html`);

  try {
    const pool = require('./config/db');
    await pool.execute('SELECT 1');
    console.log(`MySQL conectado: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'necotur'}`);
  } catch (err) {
    console.error('ERROR MySQL al iniciar:', err.code || '', err.message);
  }
});
