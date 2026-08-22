const pool = require('../config/db');

const SECCIONES = ['noticia', 'servicio', 'que_hacer', 'que_visitar'];

const SERVICIO_FILTROS = [
  'alojamiento',
  'alquiler de autos',
  'balneario',
  'farmacia',
  'gastronomia',
  'transporte',
  'telefonos utiles',
];

const DEFAULTS = {
  noticia: ['Necochea', 'Quequen', 'Playa', 'Parque', 'Actividades'],
  servicio: SERVICIO_FILTROS,
  que_hacer: [],
  que_visitar: [],
};

async function ensureFiltrosCatalogoTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS filtros_catalogo (
      id_filtro INT AUTO_INCREMENT PRIMARY KEY,
      seccion ENUM('noticia', 'servicio', 'que_hacer', 'que_visitar') NOT NULL,
      nombre VARCHAR(80) NOT NULL,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_filtros_seccion_nombre (seccion, nombre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  for (const table of ['que_hacer', 'que_visitar']) {
    try {
      const [cols] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'filtros'`,
        [table]
      );
      if (!cols.length) {
        await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN filtros TEXT DEFAULT NULL`);
      }
    } catch (err) {
      console.error(`ensureFiltrosCatalogoTable (${table}):`, err.message);
    }
  }

  for (const seccion of SECCIONES) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM filtros_catalogo WHERE seccion = ?',
      [seccion]
    );
    if (Number(rows[0].total) === 0 && DEFAULTS[seccion].length) {
      for (const nombre of DEFAULTS[seccion]) {
        await pool.execute(
          'INSERT IGNORE INTO filtros_catalogo (seccion, nombre) VALUES (?, ?)',
          [seccion, nombre]
        );
      }
    }
  }

  for (const nombre of SERVICIO_FILTROS) {
    await pool.execute(
      'INSERT IGNORE INTO filtros_catalogo (seccion, nombre) VALUES (?, ?)',
      ['servicio', nombre]
    );
  }
}

function normalizeSeccion(seccion) {
  const key = String(seccion || '').trim();
  return SECCIONES.includes(key) ? key : null;
}

async function listFiltrosBySeccion(seccion) {
  const key = normalizeSeccion(seccion);
  if (!key) return [];
  const [rows] = await pool.execute(
    'SELECT id_filtro, seccion, nombre FROM filtros_catalogo WHERE seccion = ? ORDER BY nombre ASC',
    [key]
  );
  return rows;
}

async function getAllowedFiltros(seccion) {
  const rows = await listFiltrosBySeccion(seccion);
  return rows.map((r) => r.nombre);
}

async function createFiltro(seccion, nombre) {
  const key = normalizeSeccion(seccion);
  if (!key) return { error: 'Sección inválida' };

  const clean = String(nombre || '').trim();
  if (!clean) return { error: 'El nombre del filtro es obligatorio' };
  if (clean.length > 80) return { error: 'Máximo 80 caracteres' };

  try {
    const [result] = await pool.execute(
      'INSERT INTO filtros_catalogo (seccion, nombre) VALUES (?, ?)',
      [key, clean]
    );
    return { id: result.insertId, seccion: key, nombre: clean };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return { error: 'Ya existe un filtro con ese nombre en esta sección' };
    }
    throw err;
  }
}

async function deleteFiltro(id) {
  const filtroId = Number(id);
  if (!filtroId) return { error: 'ID inválido' };

  const [rows] = await pool.execute(
    'SELECT id_filtro, seccion, nombre FROM filtros_catalogo WHERE id_filtro = ? LIMIT 1',
    [filtroId]
  );
  if (!rows.length) return { error: 'Filtro no encontrado' };

  await pool.execute('DELETE FROM filtros_catalogo WHERE id_filtro = ?', [filtroId]);
  return { deleted: rows[0] };
}

module.exports = {
  SECCIONES,
  ensureFiltrosCatalogoTable,
  normalizeSeccion,
  listFiltrosBySeccion,
  getAllowedFiltros,
  createFiltro,
  deleteFiltro,
};
