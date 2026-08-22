/*
  admin-nav.js
  ----------------
  Helper que alterna el dropdown de administracion en la navbar.
  - Controla los IDs: `adminMenuToggle`, `adminDropdown`, `navAdminWrap`.
  - Añade `aria-expanded` y la clase `active` en enlaces coincidentes.
  - No exporta variables globales; se ejecuta al cargar.
  - Incluido en las paginas admin que cargan `admin-nav.js`.
*/
(function () {
  // Obtener elementos del DOM necesarios para el menu admin.
  var toggle = document.getElementById('adminMenuToggle');   // boton que abre/cierra el menú
  var dropdown = document.getElementById('adminDropdown');   // contenedor del dropdown
  var wrap = document.getElementById('navAdminWrap');        // wrapper del item admin (para detectar clicks fuera)
  if (!toggle || !dropdown) return; // salir si faltan elementos críticos

  /**
  Cierra el menu dropdown del admin.
  - Remueve la clase 'open' (que causa display: block)
  - Actualiza aria-expanded a false para accesibilidad
   */
  function closeAdminMenu() {
    dropdown.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  // Toggle: al hacer click en el boton, abre o cierra el dropdown
  // stopPropagation evita que el click se propague al document listener
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = dropdown.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Cierra el menu cuando se hace click fuera del wrapper
  document.addEventListener('click', function (e) {
    if (wrap && !wrap.contains(e.target)) closeAdminMenu();
  });

  /**
  Cierra el menu cuando presionas Escape.
  Mejora la experiencia de usuario con navegación por teclado.
  */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAdminMenu();
  });

  // Marca con clase 'active' el link que coincide con la pagina actual
  // Obtiene el nombre del archivo de la URL (ej: 'panel_admin.html')
  // Busca todos los <a> dentro del dropdown y compara con el href actual
  var path = window.location.pathname.split('/').pop() || '';
  dropdown.querySelectorAll('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === path) link.classList.add('active');
  });
})();
