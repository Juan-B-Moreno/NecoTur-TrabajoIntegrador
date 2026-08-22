import { apiFetch } from './client';

export async function login(usuario, password) {
  const { res, data } = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: { usuario, password },
  });
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || 'Usuario o contraseña incorrectos');
  }
  return data;
}

export async function logout() {
  const { res, data } = await apiFetch('/api/auth/logout', {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error al cerrar sesión');
  return data;
}

export async function fetchMe() {
  const { res, data } = await apiFetch('/api/auth/me');
  if (res.status === 401) return null;
  if (!res.ok || !data?.ok) throw new Error(data?.message || 'Error de sesión');
  return data.user;
}
