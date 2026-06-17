/*
  crear-usuario.js
  ------------------
  Crea usuarios mediante `/api/admin/usuarios` cuando se envia `form-crear-usuario`.
  - Muestra mensajes usando `form-usuario-alert` y helpers en `window.usuariosAdmin`.
*/
(function () {
  var form = document.getElementById('form-crear-usuario');
  var alertEl = document.getElementById('form-usuario-alert');
  if (!form) return;

  // Handler del envio: construye payload y envia POST a la API
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (window.usuariosAdmin) window.usuariosAdmin.hideAlert(alertEl);

    // Construye objeto con los datos del formulario.
    var payload = {
      nombre: form.nombre.value,
      usuario: form.usuario.value,
      email: form.email.value,
      dni: form.dni.value,
      contrasena: form.contrasena.value,
      rol: form.rol.value,
    };

    // Envia POST request para crear nuevo usuario.
    fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.ok) {
          // Redirecciona a gestion de usuarios con parametro de exito
          window.location.href = '/gestion/gestionar-usuarios.html?creado=1';
          return;
        }
        window.usuariosAdmin.showAlert(
          alertEl,
          (result.data && result.data.message) || 'No se pudo crear el usuario.',
          'error'
        );
      })
      .catch(function () {
        window.usuariosAdmin.showAlert(alertEl, 'Error de conexión con el servidor.', 'error');
      });
  });
})();
