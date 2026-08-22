import { apiFetch } from './client';

export async function fetchPublicacionesRecientes(limit = 20) {
  const { res, data } = await apiFetch(`/api/admin/publicaciones-recientes?limit=${limit}`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar panel');
  return data;
}

export async function fetchUsuarios() {
  const { res, data } = await apiFetch('/api/admin/usuarios');
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar usuarios');
  return data.usuarios || [];
}

export async function fetchUsuario(id) {
  const { res, data } = await apiFetch(`/api/admin/usuarios/${id}`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Usuario no encontrado');
  return data.usuario;
}

export async function createUsuario(payload) {
  const { res, data } = await apiFetch('/api/admin/usuarios', {
    method: 'POST',
    body: payload,
  });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al crear usuario');
  return data;
}

export async function updateUsuario(id, payload) {
  const { res, data } = await apiFetch(`/api/admin/usuarios/${id}`, {
    method: 'PUT',
    body: payload,
  });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al actualizar usuario');
  return data;
}

export async function deleteUsuario(id) {
  const { res, data } = await apiFetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al eliminar usuario');
  return data;
}

export async function fetchMovimientos(limit = 100) {
  const { res, data } = await apiFetch(`/api/admin/movimientos?limit=${limit}`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar movimientos');
  return data.movimientos || [];
}

export async function fetchFiltrosAdmin(seccion) {
  const qs = seccion ? `?seccion=${encodeURIComponent(seccion)}` : '';
  const { res, data } = await apiFetch(`/api/admin/filtros${qs}`);
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cargar filtros');
  return data;
}

export async function createFiltroAdmin(seccion, nombre) {
  const { res, data } = await apiFetch('/api/admin/filtros', {
    method: 'POST',
    body: { seccion, nombre },
  });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al crear filtro');
  return data.filtro;
}

export async function deleteFiltroAdmin(id) {
  const { res, data } = await apiFetch(`/api/admin/filtros/${id}`, { method: 'DELETE' });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al eliminar filtro');
  return data;
}
