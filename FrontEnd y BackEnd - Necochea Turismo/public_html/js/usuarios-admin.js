/*
  usuarios-admin.js
  ------------------
  Pequeño helper que expone `window.usuariosAdmin` con metodos `showAlert` y `hideAlert`.
  - Usado por `crear-usuario.js`, `editar-usuario.js` y páginas admin para mostrar mensajes sobre usuarios.
*/
(function () {
  // Muestra un mensaje de alerta y hace scroll suave hacia el elemento
  function showAlert(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.classList.remove('admin-alert--ok', 'admin-alert--error');
    el.classList.add(type === 'ok' ? 'admin-alert--ok' : 'admin-alert--error');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Oculta el mensaje de alerta
  function hideAlert(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
  }

  // Expone los metodos globalmente.
  window.usuariosAdmin = { showAlert, hideAlert };
})();
