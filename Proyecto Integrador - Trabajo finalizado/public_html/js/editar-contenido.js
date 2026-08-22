/*
  editar-contenido.js
  --------------------
  Cargador/guardador generico para paginas de edicion. Espera un objeto
  `window.EDITAR_CONFIG` con al menos:
    - apiBase, dataKey, populate(form,item), serialize(form), redirectOk
  - Usa por defecto `#form-editar` y `#editar-alert` para mensajes.
  - Se integra con `window.ImagenesForm` cuando está disponible.
*/
(function () {
  function initEditarPage() {
    var cfg = window.EDITAR_CONFIG;
    if (!cfg) {
      console.error('EDITAR_CONFIG no definido');
      return;
    }

    var form = document.getElementById(cfg.formId || 'form-editar');
    var alertEl = document.getElementById('editar-alert');
    if (!form) return;

    // Obtiene el ID del item a editar desde la URL
    var id = Number(new URLSearchParams(window.location.search).get('id'));
    var galleryCtrl = null;

    if (!id) {
      showAlert('Falta el ID en la URL.', 'error');
      form.querySelector('button[type="submit"]').disabled = true;
      return;
    }

    // Muestra mensajes de alerta en la pagina
    function showAlert(msg, type) {
      if (!alertEl) return;
      alertEl.textContent = msg;
      alertEl.hidden = false;
      alertEl.className = 'admin-alert' + (type === 'ok' ? ' admin-alert--ok' : '');
    }

    // Carga el item desde la API usando la URL y el ID
    fetch(cfg.apiBase + '/' + id, { credentials: 'same-origin' })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.ok) {
          throw new Error((result.data && result.data.message) || 'No encontrado');
        }
        var item = result.data[cfg.dataKey];
        if (!item) {
          throw new Error('Respuesta inválida del servidor');
        }

        // Populate: rellena el formulario con los datos cargados
        cfg.populate(form, item);

        var sub = document.getElementById('editar-sub');
        if (sub && item.nombre) {
          sub.textContent = 'Editando: ' + item.nombre + ' (#' + id + ')';
        }

        // Inicializa la galeria de imagenes si esta disponible
        if (window.ImagenesForm) {
          galleryCtrl = window.ImagenesForm.initEditGallery({ item: item });
        }
      })
      .catch(function (err) {
        showAlert(err.message, 'error');
        form.querySelector('button[type="submit"]').disabled = true;
      });

    // Handler del envio del formulario
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (alertEl) alertEl.hidden = true;

      // Valida la galeria de imagenes si existe
      if (galleryCtrl) {
        var imgErr = galleryCtrl.validateBeforeSubmit();
        if (imgErr) {
          showAlert(imgErr, 'error');
          return;
        }
      }

      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;

      // Construye FormData con todos los datos del formulario.
      var fd = window.ImagenesForm.buildFormDataFromForm(form);

      // Envia el PUT request para actualizar el item.
      fetch(cfg.apiBase + '/' + id, {
        method: 'PUT',
        credentials: 'same-origin',
        body: fd,
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.ok) {
            // Redirecciona a la pagina de exito
            window.location.href = cfg.redirectOk;
            return;
          }
          showAlert((result.data && result.data.message) || 'No se pudo guardar.', 'error');
          if (btn) btn.disabled = false;
        })
        .catch(function () {
          showAlert('Error de conexión.', 'error');
          if (btn) btn.disabled = false;
        });
    });
  }

  // Inicia cuando el DOM esta listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditarPage);
  } else {
    initEditarPage();
  }
})();
