/*
  panel-auth.js
  ----------------
  Carga el usuario autenticado (`/api/auth/me`) y escribe el nombre en
  `.welcome-text span` de la navbar. No bloqueante; seguro para paginas admin.
*/
(function () {
  const nameEl = document.querySelector('.welcome-text span');
  if (!nameEl) return;

  // Obtiene datos del usuario autenticado desde la API
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok) throw new Error('no session');
      return res.json();
    })
    .then(function (data) {
      // Rellena el nombre en la navbar
      if (data.ok && data.user) {
        nameEl.textContent = data.user.nombre || data.user.usuario;
      }
    })
    .catch(function () {
      nameEl.textContent = '—';
    });
})();
