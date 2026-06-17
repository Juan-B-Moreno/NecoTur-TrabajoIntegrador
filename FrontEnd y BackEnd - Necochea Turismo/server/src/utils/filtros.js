const NOTICIA_FILTROS = ['Necochea', 'Quequen', 'Playa', 'Parque', 'Actividades'];
const SERVICIO_FILTROS = ['Bar', 'Restaurantes', 'Hoteles', 'Cochera', 'Balneario'];

function parseFiltrosFromDb(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const str = String(value).trim();
  if (!str) return [];
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function serializeFiltrosToDb(list) {
  const cleaned = (list || []).filter(Boolean);
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

function parseFiltrosFromBody(body, allowed) {
  if (!body || body.filtros == null) return [];
  let raw = body.filtros;
  if (!Array.isArray(raw)) {
    const str = String(raw).trim();
    if (str.startsWith('[')) {
      try {
        const parsed = JSON.parse(str);
        raw = Array.isArray(parsed) ? parsed : [];
      } catch {
        raw = str.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else {
      raw = str.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return raw.map((f) => String(f).trim()).filter((f) => allowed.includes(f));
}

function buildFiltrosSql(column, selected) {
  if (!selected.length) {
    return { clause: '', params: [] };
  }
  const parts = selected.map(() => `JSON_CONTAINS(${column}, ?, '$')`);
  return {
    clause: ` AND (${parts.join(' OR ')})`,
    params: selected.map((f) => JSON.stringify(f)),
  };
}

module.exports = {
  NOTICIA_FILTROS,
  SERVICIO_FILTROS,
  parseFiltrosFromDb,
  serializeFiltrosToDb,
  parseFiltrosFromBody,
  buildFiltrosSql,
};
