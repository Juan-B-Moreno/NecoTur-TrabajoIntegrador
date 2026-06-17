/*
  gestionar-usuarios.js
  ----------------------
  Rellena la tabla de gestión de usuarios (`#usuarios-gestion-tbody`) en vistas admin.
  - Consulta `/api/admin/usuarios` y renderiza filas con enlaces a `/editar/editar-usuario.html`.
*/
(function () {
  var tbody = document.getElementById('usuarios-gestion-tbody');
  var errEl = document.getElementById('usuarios-gestion-error');
  var okEl = document.getElementById('usuarios-gestion-ok');

  // Escapa caracteres especiales en texto para HTML seguro
  function esc(text) {
    if (text == null || text === '') return '—';
    var d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  // Retorna un badge con clase segun el rol
  function badgeRol(rol) {
    var cls = rol === 'admin' ? 'admin-badge admin-badge--admin' : 'admin-badge admin-badge--user';
    return '<span class="' + cls + '">' + esc(rol) + '</span>';
  }

  // Muestra mensajes de exito segun parametros de URL
  if (new URLSearchParams(window.location.search).get('creado') === '1' && okEl) {
    okEl.textContent = 'Usuario creado correctamente.';
    okEl.hidden = false;
  }
  if (new URLSearchParams(window.location.search).get('actualizado') === '1' && okEl) {
    okEl.textContent = 'Usuario actualizado correctamente.';
    okEl.hidden = false;
  }

  // Carga lista de usuarios desde la API
  fetch('/api/admin/usuarios', { credentials: 'same-origin' })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (!data.ok) throw new Error(data.message || 'Error');
      // Si no hay usuarios, muestra mensaje con enlace para crear
      if (!data.usuarios.length) {
        tbody.innerHTML =
          '<tr><td colspan="7" class="admin-table-empty">No hay usuarios. <a href="/crear-usuario.html">Crear el primero</a></td></tr>';
        return;
      }
      // Mapea cada usuario a una fila de tabla HTML
      tbody.innerHTML = data.usuarios
        .map(function (u) {
          return (
            '<tr>' +
            '<td>' +
            esc(u.nombre) +
            '</td>' +
            '<td><strong>' +
            esc(u.usuario) +
            '</strong></td>' +
            '<td>' +
            esc(u.email) +
            '</td>' +
            '<td>' +
            esc(u.dni) +
            '</td>' +
            '<td>' +
            badgeRol(u.rol) +
            '</td>' +
            '<td class="admin-muted">#' +
            esc(u.id_usuario) +
            '</td>' +
            '<td class="admin-actions-cell">' +
            '<a class="btn btn-primary btn-sm" href="/editar/editar-usuario.html?id=' +
            encodeURIComponent(u.id_usuario) +
            '">Editar</a>' +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
    })
    .catch(function (err) {
      tbody.innerHTML = '';
      if (errEl) {
        errEl.textContent = err.message || 'No se pudo cargar usuarios.';
        errEl.hidden = false;
      }
    });
})();
