/*
  editar-usuario.js
  ------------------
  Carga datos del usuario para editar y envia PUT a `/api/admin/usuarios/:id`.
  - Espera `#form-editar-usuario`, `#usuario-id` (hidden) y `#form-usuario-alert`.
  - Usa los helpers `window.usuariosAdmin` para mostrar alertas.
*/
(function () {
  var form = document.getElementById('form-editar-usuario');
  var alertEl = document.getElementById('form-usuario-alert');
  var idInput = document.getElementById('usuario-id');
  if (!form || !idInput) return;

  // Obtiene el ID del usuario desde la URL
  var id = Number(new URLSearchParams(window.location.search).get('id'));
  if (!id) {
    window.usuariosAdmin.showAlert(alertEl, 'Falta el ID del usuario en la URL.', 'error');
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }
  idInput.value = id;

  // Carga los datos del usuario desde la API
  fetch('/api/admin/usuarios/' + id, { credentials: 'same-origin' })
    .then(function (r) {
      return r.json().then(function (data) {
        return { ok: r.ok, data: data };
      });
    })
    .then(function (result) {
      if (!result.ok || !result.data.ok) {
        throw new Error((result.data && result.data.message) || 'Usuario no encontrado');
      }
      var u = result.data.usuario;
      // Rellena el formulario con los datos del usuario
      form.nombre.value = u.nombre || '';
      form.usuario.value = u.usuario || '';
      form.email.value = u.email || '';
      form.dni.value = u.dni || '';
      form.rol.value = u.rol || 'usuario';
      form.contrasena.value = '';
      document.getElementById('editar-usuario-sub').textContent =
        'Editando: ' + (u.usuario || '') + ' (#' + u.id_usuario + ')';
    })
    .catch(function (err) {
      window.usuariosAdmin.showAlert(alertEl, err.message, 'error');
      form.querySelector('button[type="submit"]').disabled = true;
    });

  // Handler del envio: construye payload y envia PUT
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    window.usuariosAdmin.hideAlert(alertEl);

    var payload = {
      nombre: form.nombre.value,
      usuario: form.usuario.value,
      email: form.email.value,
      dni: form.dni.value,
      contrasena: form.contrasena.value,
      rol: form.rol.value,
    };

    // Envia PUT request para actualizar el usuario.
    fetch('/api/admin/usuarios/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.ok) {
          // Redirecciona a gestion de usuarios con parametro de exito
          window.location.href = '/gestion/gestionar-usuarios.html?actualizado=1';
          return;
        }
        window.usuariosAdmin.showAlert(
          alertEl,
          (result.data && result.data.message) || 'No se pudo guardar.',
          'error'
        );
      })
      .catch(function () {
        window.usuariosAdmin.showAlert(alertEl, 'Error de conexión con el servidor.', 'error');
      });
  });
})();
