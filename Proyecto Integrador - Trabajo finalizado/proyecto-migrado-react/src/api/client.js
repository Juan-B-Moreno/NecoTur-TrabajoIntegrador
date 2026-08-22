export async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const isHtml = text.trimStart().startsWith('<!');
      data = {
        ok: false,
        message: isHtml ? 'Error de comunicación con el servidor' : text.slice(0, 300),
      };
    }
  }

  return { res, data };
}
