import { API_PATHS, DETAIL_KEYS, ITEMS_KEYS } from '../constants/contentTypes';
import { apiFetch } from './client';

const API_BASE = '/api/public';

export async function fetchList(tipo, limit, offset, filtros = []) {
  const path = API_PATHS[tipo];
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (filtros.length) params.set('filtros', filtros.join(','));
  const { res, data } = await apiFetch(`${API_BASE}/${path}?${params}`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar datos');
  const key = ITEMS_KEYS[tipo];
  return { items: data[key] || [], total: data.total ?? 0, hasMore: !!data.hasMore };
}

/** Muestra aleatoria para el inicio (que visitar, qué hacer, servicios). */
export async function fetchRandomList(tipo, limit = 3) {
  const path = API_PATHS[tipo];
  const params = new URLSearchParams({ limit: String(limit), random: '1' });
  const { res, data } = await apiFetch(`${API_BASE}/${path}?${params}`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar datos');
  const key = ITEMS_KEYS[tipo];
  return { items: data[key] || [], hasMore: false };
}

export async function fetchDetail(tipo, id) {
  const path = API_PATHS[tipo];
  const { res, data } = await apiFetch(`${API_BASE}/${path}/${id}`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'No encontrado');
  const key = DETAIL_KEYS[tipo];
  return data[key];
}

export async function fetchClima() {
  const { res, data } = await apiFetch(`${API_BASE}/clima`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error clima');
  return data;
}

export async function fetchFiltrosCatalogo(tipo) {
  const { res, data } = await apiFetch(`${API_BASE}/filtros/${tipo}`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar filtros');
  return data.filtros || [];
}
