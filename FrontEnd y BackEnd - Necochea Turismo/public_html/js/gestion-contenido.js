/*
  gestion-contenido.js
  ---------------------
  Script para pa  ginas admin "gestionar".
  - Espera `window.GESTION_CONFIG` con propiedades:
      apiList, apiBase, dataKey, idField, editUrl, listPage,
      deleteConfirm, emptyMsg, columns
  - Renderiza filas en el `tbody` con ID `gestion-tbody` y enlaza acciones de eliminación.
*/
(function () {
  var cfg = window.GESTION_CONFIG;
  if (!cfg) return;

  var tbody = document.getElementById('gestion-tbody');
  var errEl = document.getElementById('gestion-error');
  var okEl = document.getElementById('gestion-ok');
  var params = new URLSearchParams(window.location.search);

  // Escapa caracteres especiales en texto para HTML seguro
  function esc(text) {
    if (text == null || text === '') return '—';
    var d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  // Formatea fechas: extrae solo los 10 primeros caracteres (YYYY-MM-DD)
  function formatDate(val) {
    if (!val) return '—';
    var s = String(val);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }

  // Muestra mensajes de exito segun parametros de URL
  if (params.get('creado') === '1' && okEl) {
    okEl.textContent = cfg.createdMsg || 'Contenido publicado correctamente.';
    okEl.hidden = false;
  }
  if (params.get('actualizado') === '1' && okEl) {
    okEl.textContent = cfg.updatedMsg || 'Contenido actualizado correctamente.';
    okEl.hidden = false;
  }
  if (params.get('eliminado') === '1' && okEl) {
    okEl.textContent = cfg.deletedMsg || 'Contenido eliminado correctamente.';
    okEl.hidden = false;
  }

  // Construye una fila de tabla (tr) con los datos del item
  function renderRow(item) {
    var id = item[cfg.idField];
    // Mapea las columnas configuradas a celdas
    var cells = cfg.columns
      .map(function (col) {
        var val = item[col.key];
        if (col.format === 'date') val = formatDate(val);
        return '<td>' + esc(val) + '</td>';
      })
      .join('');

    return (
      '<tr>' +
      cells +
      '<td class="admin-muted">#' +
      esc(id) +
      '</td>' +
      '<td class="admin-actions-cell">' +
      '<a class="btn btn-primary btn-sm" href="' +
      cfg.editUrl +
      '?id=' +
      encodeURIComponent(id) +
      '">Editar</a> ' +
      '<button type="button" class="btn btn-secondary btn-sm btn-delete" data-id="' +
      esc(id) +
      '">Eliminar</button>' +
      '</td>' +
      '</tr>'
    );
  }

  // Vincula los botones eliminar con confirmación y DELETE request
  function bindDeleteButtons() {
    tbody.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        if (!confirm(cfg.deleteConfirm || '¿Eliminar este registro?')) return;

        // Envia DELETE request a la API
        fetch(cfg.apiBase + '/' + id, {
          method: 'DELETE',
          credentials: 'same-origin',
        })
          .then(function (r) {
            return r.json().then(function (data) {
              return { ok: r.ok, data: data };
            });
          })
          .then(function (result) {
            if (result.ok && result.data.ok) {
              // Redirecciona con parámetro de éxito
              window.location.href = cfg.listPage + '?eliminado=1';
              return;
            }
            if (errEl) {
              errEl.textContent = (result.data && result.data.message) || 'No se pudo eliminar.';
              errEl.hidden = false;
            }
          })
          .catch(function () {
            if (errEl) {
              errEl.textContent = 'Error de conexión.';
              errEl.hidden = false;
            }
          });
      });
    });
  }

  // Carga la lista desde la API y renderiza la tabla
  fetch(cfg.apiList, { credentials: 'same-origin' })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (!data.ok) throw new Error(data.message || 'Error');
      var items = data[cfg.dataKey] || [];
      // Si no hay items, muestra mensaje vacío
      if (!items.length) {
        tbody.innerHTML =
          '<tr><td colspan="' +
          (cfg.columns.length + 2) +
          '" class="admin-table-empty">' +
          (cfg.emptyMsg || 'No hay registros.') +
          '</td></tr>';
        return;
      }
      // Renderiza cada item como una fila
      tbody.innerHTML = items.map(renderRow).join('');
      bindDeleteButtons();
    })
    .catch(function (err) {
      tbody.innerHTML = '';
      if (errEl) {
        errEl.textContent = err.message || 'No se pudo cargar la lista.';
        errEl.hidden = false;
      }
    });
})();
