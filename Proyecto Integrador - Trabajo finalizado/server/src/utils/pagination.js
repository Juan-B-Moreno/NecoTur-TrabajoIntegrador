/*
  pagination.js
  ----------------
  Helpers de paginacion para listados publicos (`/api/public/*`).
  - `parsePagination`: normaliza `limit` y `offset` desde query string.
  - `paginatedResponse`: arma JSON con `total`, `hasMore` y clave de items.
*/

// Lee limit/offset del query; aplica defaults y tope maximo.
function parsePagination(query, defaultLimit = 12, maxLimit = 50) {
  let limit = Number(query.limit);
  let offset = Number(query.offset);

  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  if (!Number.isFinite(offset) || offset < 0) offset = 0;

  return { limit, offset };
}

// Construye respuesta estandar paginada (ok, items, total, hasMore).
function paginatedResponse(items, total, limit, offset, itemsKey) {
  const hasMore = offset + items.length < total;
  return {
    ok: true,
    [itemsKey]: items,
    total,
    limit,
    offset,
    hasMore,
  };
}

function wantsRandom(query) {
  const v = query?.random;
  return v === '1' || v === 'true';
}

module.exports = { parsePagination, paginatedResponse, wantsRandom };
