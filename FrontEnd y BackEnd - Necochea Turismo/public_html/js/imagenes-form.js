/*
  imagenes-form.js
  ----------------
  Utilidad que maneja inputs de imagen y galerías de edición para formularios.
  - API publica expuesta en `window.ImagenesForm`:
      MAX_IMAGENES, validateImagesOnCreate, buildFormDataFromForm,
      parseImageList, initEditGallery
  - IDs por defecto usados por `initEditGallery`:
      contenedor: `editar-imagenes-galeria`, hidden: `eliminar_imagenes`,
      hint: `editar-imagenes-hint`, fileInput: `editar-imagenes-nuevas`.
  - Usado por formularios de edición en `/public_html/editar/`.
*/
(function (global) {
  var MAX_IMAGENES = 5; // Limite maximo de imagenes por publicacion

  // Obtiene el input file de imágenes dentro del formulario
  function getImagesInput(form) {
    return form.querySelector('input[type="file"][name="imagenes"]');
  }

  // Cuenta cuantos archivos se han seleccionado en el input
  function countSelectedFiles(input) {
    if (!input || !input.files) return 0;
    return input.files.length;
  }

  // Valida que haya imagenes seleccionadas y no excedan el limite en creacion
  function validateImagesOnCreate(form) {
    var input = getImagesInput(form);
    var n = countSelectedFiles(input);
    if (!n) return 'Al menos una imagen es obligatoria.';
    if (n > MAX_IMAGENES) return 'Máximo ' + MAX_IMAGENES + ' imágenes por publicación.';
    return null;
  }

  // Construye FormData a partir de todos los campos del formulario
  // Incluye archivos del input file y campos adicionales
  function buildFormDataFromForm(form, extra) {
    var fd = new FormData();
    var filtrosInputs = form.querySelectorAll('input[type="checkbox"][name="filtros"]');
    var hasFiltrosGroup = filtrosInputs.length > 0;

    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === 'file') return; // Los archivos se añaden por separado
      if (hasFiltrosGroup && el.name === 'filtros' && el.type === 'checkbox') return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) fd.append(el.name, el.value);
        return;
      }
      if (el.tagName === 'SELECT' && el.multiple) {
        Array.prototype.forEach.call(el.selectedOptions, function (opt) {
          fd.append(el.name, opt.value);
        });
        return;
      }
      fd.append(el.name, el.value);
    });

    if (hasFiltrosGroup) {
      var selectedFiltros = [];
      filtrosInputs.forEach(function (cb) {
        if (cb.checked) selectedFiltros.push(cb.value);
      });
      fd.append('filtros', JSON.stringify(selectedFiltros));
    }

    // Añade los archivos de imagen
    var imgInput = getImagesInput(form);
    if (imgInput && imgInput.files) {
      Array.prototype.forEach.call(imgInput.files, function (file) {
        fd.append('imagenes', file);
      });
    }

    // Añade campos extras si se proporcionan
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        fd.append(key, extra[key]);
      });
    }
    return fd;
  }

  // Parsea la lista de imagenes del objeto item (puede venir como JSON, string, array, etc).
  function parseImageList(item) {
    if (!item) return [];
    if (item.img_urls && item.img_urls.length) return item.img_urls.slice();
    var raw = item.img_url || item.url_imagen;
    if (!raw) return [];
    // Intenta parsear como JSON si comienza con '['
    if (typeof raw === 'string' && raw.trim().charAt(0) === '[') {
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed.filter(Boolean);
      } catch (e) { /* formato antiguo: una sola ruta */ }
    }
    if (typeof raw === 'string') return [raw];
    return [];
  }

  // Inicializa la galeria de edicion: permite ver, quitar y añadir imagenes
  function initEditGallery(options) {
    var container = document.getElementById(options.containerId || 'editar-imagenes-galeria');
    var hidden = document.getElementById(options.hiddenId || 'eliminar_imagenes');
    var hint = document.getElementById(options.hintId || 'editar-imagenes-hint');
    var fileInput = document.getElementById(options.fileInputId || 'editar-imagenes-nuevas');
    if (!container || !hidden) return null;

    var actuales = parseImageList(options.item); // Imagenes guardadas
    var eliminar = []; // Registro de imágenes a eliminar

    // Renderiza las imagenes en el contenedor con boton "Quitar" para cada una
    function render() {
      container.innerHTML = '';
      if (!actuales.length) {
        container.innerHTML = '<p class="editar-imagenes-vacio">Sin imágenes guardadas.</p>';
      } else {
        actuales.forEach(function (url) {
          var wrap = document.createElement('div');
          wrap.className = 'editar-imagen-item';
          var img = document.createElement('img');
          img.src = url;
          img.alt = 'Imagen de la publicación';
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-secondary btn-quitar-imagen';
          btn.setAttribute('data-url', url);
          btn.textContent = 'Quitar';
          wrap.appendChild(img);
          wrap.appendChild(btn);
          container.appendChild(wrap);
        });
      }

      // Binding de clicks en botones "Quitar": mueve a lista de eliminadas y re-renderiza
      container.querySelectorAll('.btn-quitar-imagen').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var url = btn.getAttribute('data-url');
          if (eliminar.indexOf(url) === -1) eliminar.push(url);
          actuales = actuales.filter(function (u) {
            return u !== url;
          });
          hidden.value = JSON.stringify(eliminar);
          render();
          updateHint();
        });
      });

      updateHint();
    }

    // Actualiza el hint de cuántas imágenes hay / máximo
    function updateHint() {
      if (!hint) return;
      var nuevas = fileInput && fileInput.files ? fileInput.files.length : 0;
      var total = actuales.length + nuevas;
      hint.textContent =
        'Imágenes: ' +
        total +
        ' / ' +
        MAX_IMAGENES +
        ' (podés quitar las actuales y agregar otras)';
      // Desactiva el input si ya se alcanzo el máximo
      if (fileInput) {
        fileInput.disabled = actuales.length >= MAX_IMAGENES;
      }
    }

    // Valida limite de imágenes cuando se selecciona un archivo nuevo
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var nuevas = fileInput.files ? fileInput.files.length : 0;
        if (actuales.length + nuevas > MAX_IMAGENES) {
          alert('Máximo ' + MAX_IMAGENES + ' imágenes en total.');
          fileInput.value = '';
        }
        updateHint();
      });
    }

    hidden.value = '[]'; // Inicializa el campo oculto
    render();

    // Retorna API publica para la galeria
    return {
      getRemainingSlots: function () {
        var nuevas = fileInput && fileInput.files ? fileInput.files.length : 0;
        return MAX_IMAGENES - actuales.length - nuevas;
      },
      validateBeforeSubmit: function () {
        var nuevas = fileInput && fileInput.files ? fileInput.files.length : 0;
        if (actuales.length + nuevas < 1) {
          return 'Debe quedar al menos una imagen.';
        }
        if (actuales.length + nuevas > MAX_IMAGENES) {
          return 'Máximo ' + MAX_IMAGENES + ' imágenes.';
        }
        return null;
      },
    };
  }

  // Expone la API publica en window.ImagenesForm
  global.ImagenesForm = {
    MAX_IMAGENES: MAX_IMAGENES,
    validateImagesOnCreate: validateImagesOnCreate,
    buildFormDataFromForm: buildFormDataFromForm,
    parseImageList: parseImageList,
    initEditGallery: initEditGallery,
  };
})(window);
