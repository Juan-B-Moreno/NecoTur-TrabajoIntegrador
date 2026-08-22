/*
  contenido-admin.js
  --------------------
  Helpers para el envio de formularios de creacion por admin.
  - Proporciona la función global `handleSubmit(event)` usada por formularios admin.
  - Usa `window.ImagenesForm` para validacion de imagenes y `#contenido-admin-alert` para mensajes.
  - Mapea los IDs de formulario a los endpoints API en `configs`.
*/
(function () {
  var alertEl = document.getElementById('contenido-admin-alert');

  // Muestra mensaje de alerta en la página
  function showAlert(msg, type) {
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.hidden = false;
    alertEl.className = 'admin-alert' + (type === 'ok' ? ' admin-alert--ok' : '');
  }

  // Oculta el mensaje de alerta
  function hideAlert() {
    if (alertEl) alertEl.hidden = true;
  }

  // Configuracion de endpoints y redirecciones por tipo de formulario
  var configs = {
    'form-noticia': {
      url: '/api/noticias',
      redirect: '/gestion/gestionar-noticias.html?creado=1',
    },
    'form-servicio': {
      url: '/api/servicios',
      redirect: '/gestion/gestionar-servicios.html?creado=1',
    },
    'form-hacer': {
      url: '/api/que-hacer',
      redirect: '/gestion/gestionar-que-hacer.html?creado=1',
    },
    'form-visitar': {
      url: '/api/que-visitar',
      redirect: '/gestion/gestionar-que-visitar.html?creado=1',
    },
  };

  // Handler global para envio de formularios: valida imagenes y envia POST a API
  window.handleSubmit = function (event) {
    event.preventDefault();
    hideAlert();
    var form = event.target;
    var cfg = configs[form.id];
    if (!cfg) return;

    // Valida que haya al menos 1 imagen y como maximo 5
    var imgErr = window.ImagenesForm.validateImagesOnCreate(form);
    if (imgErr) {
      showAlert(imgErr, 'error');
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    // Construye FormData con archivos de imagen
    var formData = window.ImagenesForm.buildFormDataFromForm(form);

    // Envía POST request al endpoint configurado
    fetch(cfg.url, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.ok) {
          // Redirecciona a la pagina de gestion con parametro de exito
          window.location.href = cfg.redirect;
          return;
        }
        showAlert((result.data && result.data.message) || 'No se pudo publicar.', 'error');
        if (btn) btn.disabled = false;
      })
      .catch(function () {
        showAlert('Error de conexión con el servidor.', 'error');
        if (btn) btn.disabled = false;
      });
  };
})();
