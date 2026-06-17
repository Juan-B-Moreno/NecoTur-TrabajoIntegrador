(function (global) {
  var NOTICIA = ['Necochea', 'Quequen', 'Playa', 'Parque', 'Actividades'];
  var SERVICIO = ['Bar', 'Restaurantes', 'Hoteles', 'Cochera', 'Balneario'];

  function parseList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.slice();
    try {
      var parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.slice() : [];
    } catch (e) {
      return [];
    }
  }

  function setChecked(form, filtros) {
    if (!form) return;
    var list = parseList(filtros);
    form.querySelectorAll('input[type="checkbox"][name="filtros"]').forEach(function (cb) {
      cb.checked = list.indexOf(cb.value) !== -1;
    });
  }

  function renderFilterBar(container, options, onChange) {
    if (!container) return;
    container.innerHTML = '';
    container.className = 'lista-filtros-wrap';

    var label = document.createElement('span');
    label.className = 'lista-filtros-label';
    label.textContent = 'Filtrar por:';
    container.appendChild(label);

    var inner = document.createElement('div');
    inner.className = 'lista-filtros-inner';
    container.appendChild(inner);

    var selected = [];

    function notify() {
      if (typeof onChange === 'function') onChange(selected.slice());
    }

    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-btn';
      btn.textContent = opt;
      btn.dataset.filter = opt;
      btn.addEventListener('click', function () {
        var idx = selected.indexOf(opt);
        if (idx === -1) {
          selected.push(opt);
          btn.classList.add('active');
        } else {
          selected.splice(idx, 1);
          btn.classList.remove('active');
        }
        notify();
      });
      inner.appendChild(btn);
    });

    return {
      getSelected: function () {
        return selected.slice();
      },
      clear: function () {
        selected = [];
        inner.querySelectorAll('.filter-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        notify();
      },
    };
  }

  global.FiltrosForm = {
    NOTICIA: NOTICIA,
    SERVICIO: SERVICIO,
    parseList: parseList,
    setChecked: setChecked,
    renderFilterBar: renderFilterBar,
  };
})(window);
