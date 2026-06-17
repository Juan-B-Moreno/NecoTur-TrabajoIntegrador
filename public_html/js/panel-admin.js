/*
  panel-admin.js
  ----------------
  Helpers para el dashboard del panel admin. Carga y renderiza:
  - publicaciones recientes en `#publicaciones-tbody`
  - usuarios en `#usuarios-tbody`
  - Espera que esos `tbody` y elementos de error opcionales existan.
*/
(function () {
  var usuariosBody = document.getElementById('usuarios-tbody');
  var pubBody = document.getElementById('publicaciones-tbody');
  var usuariosErr = document.getElementById('usuarios-error');
  var pubErr = document.getElementById('publicaciones-error');

  // Escapa caracteres especiales en texto para HTML seguro
  function esc(text) {
    if (text == null || text === '') return '—';
    var d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  // Retorna un badge con clase según el rol
  function badgeRol(rol) {
    var cls = rol === 'admin' ? 'admin-badge admin-badge--admin' : 'admin-badge admin-badge--user';
    return '<span class="' + cls + '">' + esc(rol) + '</span>';
  }

  // Formatea fechas con hora en formato corto (es-AR)
  function formatFecha(val) {
    if (!val || val === '1970-01-01T00:00:00.000Z') return '—';
    try {
      var d = new Date(val);
      if (isNaN(d.getTime())) return esc(val);
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return esc(val);
    }
  }

  // Obtiene el nombre del creador desde los datos disponibles
  function creadorCell(row) {
    if (row.creador_nombre) {
      return esc(row.creador_nombre);
    }
    if (row.creador_usuario) {
      return esc(row.creador_usuario);
    }
    return '<span class="admin-muted">Sin asignar</span>';
  }

  // Carga lista de usuarios desde API y renderiza tabla
  fetch('/api/admin/usuarios', { credentials: 'same-origin' })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (!data.ok) throw new Error(data.message || 'Error');
      if (!data.usuarios.length) {
        usuariosBody.innerHTML =
          '<tr><td colspan="7" class="admin-table-empty">No hay usuarios registrados.</td></tr>';
        return;
      }
      // Mapea cada usuario a una fila de tabla
      usuariosBody.innerHTML = data.usuarios
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
      usuariosBody.innerHTML = '';
      if (usuariosErr) {
        usuariosErr.textContent = err.message || 'No se pudo cargar usuarios.';
        usuariosErr.hidden = false;
      }
    });

  // Carga publicaciones recientes desde API y renderiza tabla
  fetch('/api/admin/publicaciones-recientes?limit=25', { credentials: 'same-origin' })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (!data.ok) throw new Error(data.message || 'Error');
      if (!data.publicaciones.length) {
        pubBody.innerHTML =
          '<tr><td colspan="5" class="admin-table-empty">No hay publicaciones todavía.</td></tr>';
        return;
      }
      // Mapea cada publicación a una fila de tabla
      pubBody.innerHTML = data.publicaciones
        .map(function (p) {
          return (
            '<tr>' +
            '<td><span class="admin-tipo">' +
            esc(p.tipo) +
            '</span></td>' +
            '<td>' +
            esc(p.titulo) +
            '</td>' +
            '<td>' +
            creadorCell(p) +
            '</td>' +
            '<td>' +
            formatFecha(p.fecha_orden) +
            '</td>' +
            '<td class="admin-muted">#' +
            esc(p.id) +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
    })
    .catch(function (err) {
      pubBody.innerHTML = '';
      if (pubErr) {
        pubErr.textContent = err.message || 'No se pudo cargar publicaciones.';
        pubErr.hidden = false;
      }
    });
})();
