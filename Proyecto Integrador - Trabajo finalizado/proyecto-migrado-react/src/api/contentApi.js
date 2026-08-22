import { apiFetch } from './client';

const CONTENT_ENDPOINTS = {
  noticia: '/api/noticias',
  servicio: '/api/servicios',
  que_hacer: '/api/que-hacer',
  que_visitar: '/api/que-visitar',
};

export function getContentEndpoint(tipo) {
  return CONTENT_ENDPOINTS[tipo];
}

export async function createContent(tipo, formData) {
  const url = getContentEndpoint(tipo);
  const { res, data } = await apiFetch(url, { method: 'POST', body: formData });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al publicar');
  return data;
}

export async function updateContent(tipo, id, formData) {
  const url = `${getContentEndpoint(tipo)}/${id}`;
  const { res, data } = await apiFetch(url, { method: 'PUT', body: formData });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al actualizar');
  return data;
}

export async function deleteContent(tipo, id) {
  const url = `${getContentEndpoint(tipo)}/${id}`;
  const { res, data } = await apiFetch(url, { method: 'DELETE' });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al eliminar');
  return data;
}

export async function fetchContentItem(tipo, id) {
  const url = `${getContentEndpoint(tipo)}/${id}`;
  const { res, data } = await apiFetch(url);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'No encontrado');
  const keys = {
    noticia: 'noticia',
    servicio: 'servicio',
    que_hacer: 'actividad',
    que_visitar: 'lugar',
  };
  return data[keys[tipo]];
}

export async function fetchContentList(tipo, apiList) {
  const { res, data } = await apiFetch(apiList);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar listado');
  return data;
}

export async function fetchMisNoticias() {
  const { res, data } = await apiFetch('/api/noticias/mias');
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar noticias');
  return data.noticias || [];
}
