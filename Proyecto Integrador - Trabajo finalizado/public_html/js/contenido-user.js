/*
  contenido-user.js
  ------------------
  Maneja el envio del `form-noticia` en la parte publica.
  - Usa `window.ImagenesForm.buildFormDataFromForm` y valida con `validateImagesOnCreate`.
  - Muestra mensajes en `#contenido-user-alert`.
*/
(function () {
  var form = document.getElementById('form-noticia');
  var alertEl = document.getElementById('contenido-user-alert');
  if (!form) return;

  // Muestra mensaje de alerta en la página
  function showAlert(msg, type) {
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.hidden = false;
    alertEl.className = 'admin-alert' + (type === 'ok' ? ' admin-alert--ok' : '');
  }

  // Handler del formulario: valida imagenes y envia POST a API
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (alertEl) alertEl.hidden = true;

    // Valida que haya entre 1 y 5 imagenes
    var imgErr = window.ImagenesForm.validateImagesOnCreate(form);
    if (imgErr) {
      showAlert(imgErr, 'error');
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    // Envia POST request con los datos y imagenes del formulario
    fetch('/api/noticias', {
      method: 'POST',
      credentials: 'same-origin',
      body: window.ImagenesForm.buildFormDataFromForm(form),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.ok) {
          // Redirecciona a mis noticias con parametro de exito
          window.location.href = '/gestion/gestionar-mis-noticias.html?creado=1';
          return;
        }
        showAlert((result.data && result.data.message) || 'No se pudo publicar.', 'error');
        if (btn) btn.disabled = false;
      })
      .catch(function () {
        showAlert('Error de conexión con el servidor.', 'error');
        if (btn) btn.disabled = false;
      });
  });
})();
