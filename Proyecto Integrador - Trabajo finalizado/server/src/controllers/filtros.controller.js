const {
  SECCIONES,
  normalizeSeccion,
  listFiltrosBySeccion,
  getAllowedFiltros,
  createFiltro,
  deleteFiltro,
} = require('../utils/filtrosCatalogo');
const { logMovimiento } = require('../utils/auditLog');

async function listPublicFiltros(req, res) {
  const seccion = normalizeSeccion(req.params.seccion);
  if (!seccion) {
    return res.status(400).json({ ok: false, message: 'Sección inválida' });
  }

  try {
    const filtros = await getAllowedFiltros(seccion);
    res.json({ ok: true, filtros });
  } catch (err) {
    console.error('listPublicFiltros:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudieron cargar los filtros' });
  }
}

async function listAdminFiltros(req, res) {
  const seccion = req.query.seccion ? normalizeSeccion(req.query.seccion) : null;

  try {
    if (seccion) {
      const filtros = await listFiltrosBySeccion(seccion);
      return res.json({ ok: true, filtros });
    }

    const grouped = {};
    for (const key of SECCIONES) {
      grouped[key] = await listFiltrosBySeccion(key);
    }
    res.json({ ok: true, secciones: SECCIONES, filtros: grouped });
  } catch (err) {
    console.error('listAdminFiltros:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudieron cargar los filtros' });
  }
}

async function createFiltroAdmin(req, res) {
  const { seccion, nombre } = req.body || {};

  try {
    const outcome = await createFiltro(seccion, nombre);
    if (outcome.error) {
      return res.status(400).json({ ok: false, message: outcome.error });
    }

    res.status(201).json({
      ok: true,
      message: 'Filtro creado correctamente',
      filtro: outcome,
    });

    await logMovimiento(req, {
      accion: 'crear',
      entidad: 'filtro',
      entidad_id: outcome.id,
      entidad_titulo: outcome.nombre,
      detalle: `Creó filtro «${outcome.nombre}» en ${outcome.seccion}`,
    });
  } catch (err) {
    console.error('createFiltroAdmin:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo crear el filtro' });
  }
}

async function deleteFiltroAdmin(req, res) {
  try {
    const outcome = await deleteFiltro(req.params.id);
    if (outcome.error) {
      const status = outcome.error === 'Filtro no encontrado' ? 404 : 400;
      return res.status(status).json({ ok: false, message: outcome.error });
    }

    res.json({ ok: true, message: 'Filtro eliminado correctamente' });

    await logMovimiento(req, {
      accion: 'eliminar',
      entidad: 'filtro',
      entidad_id: outcome.deleted.id_filtro,
      entidad_titulo: outcome.deleted.nombre,
      detalle: `Eliminó filtro «${outcome.deleted.nombre}» de ${outcome.deleted.seccion}`,
    });
  } catch (err) {
    console.error('deleteFiltroAdmin:', err.message);
    res.status(500).json({ ok: false, message: 'No se pudo eliminar el filtro' });
  }
}

module.exports = {
  listPublicFiltros,
  listAdminFiltros,
  createFiltroAdmin,
  deleteFiltroAdmin,
};
