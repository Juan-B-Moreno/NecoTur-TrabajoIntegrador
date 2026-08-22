/*
  public-site.js
  ----------------
  Utilidades compartidas para el sitio publico (listas y detalle).
  - Expone `window.PublicSite` con helpers para obtener listas/detalles,
    renderizar tarjetas, paginacion y helpers de URL para paginas de detalle.
  - Consumido por `public-index.js`, `public-detalle.js` y `public-lista-*.js`.
*/
(function () {
  const API_BASE = '/api/public';

  // Mapeo de tipos de contenido a archivos de detalle
  const DETALLE_FILES = {
    noticia: 'detalle-noticias.html',
    servicio: 'detalle-servicios.html',
    que_hacer: 'detalle-que-hacer.html',
    que_visitar: 'detalle-que-visitar.html',
  };

  // Mapeo de tipos a rutas de API
  const API_PATHS = {
    noticia: 'noticias',
    servicio: 'servicios',
    que_hacer: 'que-hacer',
    que_visitar: 'que-visitar',
  };

  // Mapeo de tipos a claves en respuestas de lista.
  const ITEMS_KEYS = {
    noticia: 'noticias',
    servicio: 'servicios',
    que_hacer: 'actividades',
    que_visitar: 'lugares',
  };

  // Mapeo de tipos a claves en respuestas de detalle
  const DETAIL_KEYS = {
    noticia: 'noticia',
    servicio: 'servicio',
    que_hacer: 'actividad',
    que_visitar: 'lugar',
  };

  // Escapa caracteres especiales para HTML seguro
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Formatea fecha corta (ej: 15 oct 2024)
  function formatFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return esc(fecha);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Formatea fecha larga (ej: 15 de octubre de 2024)
  function formatFechaLarga(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return esc(fecha);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Trunca texto a X caracteres y añade puntos suspensivos
  function truncate(text, max) {
    const t = (text || '').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
  }

  // Obtiene array de URLs de imagenes de un item
  function itemImages(item) {
    if (item.img_urls && item.img_urls.length) return item.img_urls;
    if (item.img_url) return [item.img_url];
    return [];
  }

  // Obtiene la primera imagen de un item
  function primaryImage(item) {
    const list = itemImages(item);
    return list[0] || null;
  }

  // Genera HTML para imagen con fallback a color solido
  function imagenHtml(url, alt, fallbackColor, extraClass) {
    const altEsc = esc(alt || '');
    if (url) {
      const cls = extraClass ? ` class="${extraClass}"` : '';
      return `<img src="${esc(url)}" alt="${altEsc}"${cls} style="width:100%;height:100%;object-fit:cover;">`;
    }
    return `<div style="width:100%;height:100%;background:${fallbackColor || '#e8e8e8'};min-height:180px;" aria-hidden="true"></div>`;
  }

  // Genera URL de detalle para un item.
  function detalleUrl(tipo, id, basePath) {
    const file = DETALLE_FILES[tipo];
    if (!file || !id) return '#';
    const prefix = basePath || 'detalles/';
    return `${prefix}${file}?id=${encodeURIComponent(id)}`;
  }

  // Genera URL de API para lista de items con paginacion.
  function apiListUrl(tipo, limit, offset) {
    const path = API_PATHS[tipo];
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return `${API_BASE}/${path}?${params}`;
  }

  // Genera URL de API para detalle de un item.
  function apiDetailUrl(tipo, id) {
    return `${API_BASE}/${API_PATHS[tipo]}/${id}`;
  }

  // Comprueba si un href coincide con una pagina especifica.
  function hrefMatchesPage(href, page) {
    if (!href) return false;
    const clean = String(href).split('?')[0].split('#')[0].toLowerCase();
    return clean === page || clean === `../${page}` || clean.endsWith(`/${page}`);
  }

  // Calcula path base para URLs de detalle segun la pagina actual.
  function detalleBasePathForCurrentPage() {
    const path = (window.location.pathname || '').toLowerCase();
    return path.includes('/detalles/') ? '' : 'detalles/';
  }

  // Define las secciones del menu publico.
  function publicMenuSections() {
    return [
      { tipo: 'que_visitar', page: 'que-visitar.html', label: 'Qué Visitar', more: 'Ver más →' },
      { tipo: 'servicio', page: 'servicios.html', label: 'Servicios', more: 'Ver más →' },
      { tipo: 'que_hacer', page: 'que-hacer.html', label: 'Qué Hacer', more: 'Ver más →' },
    ];
  }

  // Carga y renderiza dropdowns en la navegacion desktop.
  async function initDesktopPublicDropdowns() {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;

    const sections = publicMenuSections();
    const detalleBasePath = detalleBasePathForCurrentPage();

    await Promise.all(
      sections.map(async (section) => {
        const sourceLink = Array.from(nav.querySelectorAll('.nav-link[href]')).find((el) =>
          hrefMatchesPage(el.getAttribute('href'), section.page)
        );
        if (!sourceLink) return;

        const navItem = sourceLink.closest('.nav-item');
        const dropdown = navItem ? navItem.querySelector('.dropdown') : null;
        if (!dropdown) return;

        try {
          // Carga los items y genera enlaces
          const { items } = await fetchList(section.tipo, 5, 0);
          const links = items
            .map(
              (item) =>
                `<a href="${detalleUrl(section.tipo, item.id, detalleBasePath)}">${esc(item.nombre)}</a>`
            )
            .join('');
          dropdown.innerHTML = `${links}<a href="${esc(
            sourceLink.getAttribute('href') || section.page
          )}" style="color:#8161AF;font-weight:700">${section.more}</a>`;
        } catch (err) {
          console.error(`No se pudo cargar dropdown desktop de ${section.tipo}:`, err);
        }
      })
    );
  }

  // Carga y renderiza menu desplegable en navegacion mobile.
  async function initMobilePublicDropdowns() {
    const mobMenu = document.getElementById('mobMenu');
    if (!mobMenu) return;

    const sections = publicMenuSections();

    const detalleBasePath = detalleBasePathForCurrentPage();

    await Promise.all(
      sections.map(async (section) => {
        const source = Array.from(mobMenu.querySelectorAll('.mob-item[href]')).find((el) =>
          hrefMatchesPage(el.getAttribute('href'), section.page)
        );
        if (!source) return;

        try {
          // Carga los items y construye submenu.
          const { items } = await fetchList(section.tipo, 5, 0);
          const group = document.createElement('div');
          group.className = 'mob-submenu-group';

          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = `mob-item mob-item-toggle${source.classList.contains('active') ? ' active' : ''}`;
          toggle.setAttribute('aria-expanded', source.classList.contains('active') ? 'true' : 'false');
          toggle.innerHTML = `<span>${esc(section.label)}</span><span class="arr">▾</span>`;

          const submenu = document.createElement('div');
          submenu.className = `mob-submenu${source.classList.contains('active') ? ' open' : ''}`;

          const links = items
            .map(
              (item) =>
                `<a class="mob-subitem" href="${detalleUrl(section.tipo, item.id, detalleBasePath)}">${esc(
                  item.nombre
                )}</a>`
            )
            .join('');
          submenu.innerHTML = `${links}<a class="mob-subitem mob-subitem-more" href="${esc(
            source.getAttribute('href') || section.page
          )}">${section.more}</a>`;

          // Toggle para abrir/cerrar submenu.
          toggle.addEventListener('click', () => {
            const open = submenu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
          });

          group.appendChild(toggle);
          group.appendChild(submenu);
          source.replaceWith(group);
        } catch (err) {
          console.error(`No se pudo cargar menú de ${section.tipo}:`, err);
        }
      })
    );
  }

  // Renderiza una tarjeta de noticia para lista.   
  function cardNoticiaList(item) {
    const href = detalleUrl('noticia', item.id);
    const img = imagenHtml(primaryImage(item), item.nombre, '#f0d8e8');
    return `
      <a class="news-card" href="${href}">
        <div class="card-img" style="background:#f0d8e8">
          <div class="ns-img" style="height:180px;width:100%;overflow:hidden;">${img}</div>
        </div>
        <div class="card-body">
          <div class="card-cat" style="background:#EF5EA528;color:#8a1060">Noticias</div>
          <div class="card-name">${esc(item.nombre)}</div>
          <div class="card-date">${esc(formatFecha(item.fecha))}</div>
          <div class="card-desc">${esc(truncate(item.descripcion, 160))}</div>
          <div class="card-link">Leer más →</div>
        </div>
      </a>`;
  }

  // Renderiza una tarjeta de servicio para lista.
  function cardServicioList(item) {
    const href = detalleUrl('servicio', item.id);
    const img = imagenHtml(primaryImage(item), item.nombre, '#e8e0f4');
    const contacto = item.contacto ? `<div class="card-meta-item">📞 ${esc(truncate(item.contacto, 40))}</div>` : '';
    return `
      <a class="service-card" href="${href}">
        <div class="card-img" style="background:#e8e0f4">${img}</div>
        <div class="card-body">
          <div class="card-cat" style="background:#8161AF28;color:#4a2080">Servicio</div>
          <div class="card-name">${esc(item.nombre)}</div>
          <div class="card-desc">${esc(truncate(item.descripcion, 160))}</div>
          <div class="card-meta">${contacto}</div>
          <div class="card-link">Ver más →</div>
        </div>
      </a>`;
  }

  // Renderiza una tarjeta "Qué visitar" para lista.
  function cardQueVisitarList(item) {
    const href = detalleUrl('que_visitar', item.id);
    const img = imagenHtml(primaryImage(item), item.nombre, '#c8e8f4');
    return `
      <a class="dest-card" href="${href}">
        <div class="card-img" style="background:#c8e8f4">
          ${img}
        </div>
        <div class="card-body">
          <div class="card-cat" style="background:#8CD4EF28;color:#1a6080">Qué visitar</div>
          <div class="card-name">${esc(item.nombre)}</div>
          <div class="card-desc">${esc(truncate(item.descripcion, 160))}</div>
          <div class="card-link">Ver más →</div>
        </div>
      </a>`;
  }

  // Renderiza una tarjeta "Qué hacer" para lista.
  function cardQueHacerList(item) {
    const href = detalleUrl('que_hacer', item.id);
    const img = imagenHtml(primaryImage(item), item.nombre, '#e8f4d0');
    const contacto = item.contacto ? `<div class="card-meta-item">📞 ${esc(truncate(item.contacto, 40))}</div>` : '';
    return `
      <a class="hacer-card" href="${href}">
        <div class="card-img" style="background:#e8f4d0">${img}</div>
        <div class="card-body">
          <div class="card-cat" style="background:#9DC13828;color:#3a5810">Actividad</div>
          <div class="card-name">${esc(item.nombre)}</div>
          <div class="card-desc">${esc(truncate(item.descripcion, 160))}</div>
          <div class="card-meta">${contacto}</div>
          <div class="card-link">Ver más →</div>
        </div>
      </a>`;
  }

  // Renderiza tarjeta de "Qué visitar" para homepage.
  function cardVisitarHome(item) {
    const href = detalleUrl('que_visitar', item.id);
    const url = primaryImage(item);
    const img = url
      ? `<img src="${esc(url)}" alt="${esc(item.nombre)}">`
      : `<div style="width:100%;height:100%;background:#c8e8f4;min-height:160px;"></div>`;
    return `
      <a class="dest-card" href="${href}">
        <div class="dest-img">${img}</div>
        <div class="dest-body">
          <div class="dest-tag" style="background:#8CD4EF28;color:#1a6080">Lugar</div>
          <div class="dest-name">${esc(item.nombre)}</div>
          <div class="dest-desc">${esc(truncate(item.descripcion, 120))}</div>
          <div class="dest-link">Ver más →</div>
        </div>
      </a>`;
  }

  // Renderiza tarjeta de "Qué hacer" para homepage (misma grilla 3 columnas que visitar/noticias).
  function cardHacerHome(item) {
    const href = detalleUrl('que_hacer', item.id);
    const url = primaryImage(item);
    const img = url
      ? `<img src="${esc(url)}" alt="${esc(item.nombre)}">`
      : `<div style="width:100%;height:100%;background:#e8f4d0;min-height:160px;"></div>`;
    return `
      <a class="dest-card hacer-home-card" href="${href}">
        <div class="dest-img">${img}</div>
        <div class="dest-body">
          <div class="dest-tag" style="background:#9DC13828;color:#3a5810">Actividad</div>
          <div class="dest-name">${esc(item.nombre)}</div>
          <div class="dest-desc">${esc(truncate(item.descripcion, 120))}</div>
          <div class="dest-link">Ver más →</div>
        </div>
      </a>`;
  }

  // Renderiza tarjeta de noticia para homepage.
  function cardNoticiaHome(item) {
    const href = detalleUrl('noticia', item.id);
    const url = primaryImage(item);
    const imgInner = url
      ? `<img src="${esc(url)}" alt="${esc(item.nombre)}" style="width:100%;height:100%;object-fit:cover;">`
      : '';
    return `
      <a class="news-card" href="${href}">
        <div class="news-img" style="background:#f0d8e8">${imgInner}</div>
        <div class="news-body">
          <div class="news-meta">
            <span class="news-tag" style="background:#EF5EA528;color:#8a1060">Noticias</span>
            <span class="news-date">${esc(formatFecha(item.fecha))}</span>
          </div>
          <div class="news-title">${esc(item.nombre)}</div>
          <div class="news-excerpt">${esc(truncate(item.descripcion, 120))}</div>
        </div>
      </a>`;
  }

  // Mapeo de funciones de renderizado por tipo.
  const RENDER_LIST = {
    noticia: cardNoticiaList,
    servicio: cardServicioList,
    que_hacer: cardQueHacerList,
    que_visitar: cardQueVisitarList,
  };

  // Obtiene una lista de items de la API.
  async function fetchList(tipo, limit, offset, filtros) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (filtros && filtros.length) {
      params.set('filtros', filtros.join(','));
    }
    const res = await fetch(`${apiListUrl(tipo, limit, offset).split('?')[0]}?${params}`);
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Error al cargar datos');
    }
    const key = ITEMS_KEYS[tipo];
    return { items: data[key] || [], hasMore: !!data.hasMore };
  }

  // Obtiene un item de detalle desde la API.
  async function fetchDetail(tipo, id) {
    const res = await fetch(apiDetailUrl(tipo, id));
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'No encontrado');
    }
    const key = DETAIL_KEYS[tipo];
    return data[key];
  }

  // Inicializa una lista paginada con boton "Ver más".
  function initListaPaginada(config) {
    const tipo = config.tipo;
    const grid = document.getElementById(config.gridId || 'cards-grid');
    const btn = document.getElementById(config.btnId || 'btn-ver-mas');
    const wrap = document.getElementById(config.wrapId || 'lista-ver-mas-wrap');
    const pageSize = config.pageSize || 12;
    const render = config.renderCard || RENDER_LIST[tipo];
    const filtrosContainer = document.getElementById(config.filtrosContainerId || 'lista-filtros');
    const filtrosOptions = config.filtrosOptions || null;

    if (!grid || !tipo || !render) return;

    let offset = 0;
    let loading = false;
    let selectedFiltros = [];

    if (filtrosOptions && filtrosContainer && window.FiltrosForm) {
      window.FiltrosForm.renderFilterBar(filtrosContainer, filtrosOptions, (selected) => {
        selectedFiltros = selected;
        offset = 0;
        loadMore(false);
      });
    }

    // Carga mas items y los renderiza.
    async function loadMore(append) {
      if (loading) return;
      loading = true;
      if (btn) btn.disabled = true;

      try {
        const { items, hasMore } = await fetchList(tipo, pageSize, offset, selectedFiltros);
        const html = items.length
          ? items.map((item) => render(item)).join('')
          : '<p class="lista-empty">No hay resultados con esos filtros.</p>';
        if (append) {
          grid.insertAdjacentHTML('beforeend', html);
        } else {
          grid.innerHTML = html;
        }
        offset += items.length;

        if (wrap && btn) {
          if (hasMore) {
            wrap.hidden = false;
            btn.disabled = false;
          } else {
            wrap.hidden = true;
          }
        }
      } catch (err) {
        console.error(err);
        if (!append) {
          grid.innerHTML = '<p class="lista-empty">No se pudo cargar el contenido.</p>';
        }
        if (wrap) wrap.hidden = true;
      } finally {
        loading = false;
      }
    }

    // Carga inicial
    loadMore(false);

    // Evento del boton "Ver más".
    if (btn) {
      btn.addEventListener('click', () => loadMore(true));
    }
  }

  // Carga items en una grilla sin paginacion.
  async function loadIntoGrid(gridId, tipo, limit, renderCard) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const render = renderCard || RENDER_LIST[tipo];
    try {
      const { items } = await fetchList(tipo, limit, 0);
      grid.innerHTML = items.map((item) => render(item)).join('');
    } catch (err) {
      console.error(err);
      grid.innerHTML = '';
    }
  }

  // Expone la API publica.
  window.PublicSite = {
    esc,
    formatFecha,
    formatFechaLarga,
    truncate,
    itemImages,
    primaryImage,
    imagenHtml,
    detalleUrl,
    apiListUrl,
    apiDetailUrl,
    fetchList,
    fetchDetail,
    initListaPaginada,
    loadIntoGrid,
    cardNoticiaList,
    cardServicioList,
    cardQueVisitarList,
    cardQueHacerList,
    cardVisitarHome,
    cardHacerHome,
    cardNoticiaHome,
    ITEMS_KEYS,
    DETAIL_KEYS,
    API_PATHS,
  };

  // Inicializa dropdowns cuando el DOM esta listo.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initDesktopPublicDropdowns();
      initMobilePublicDropdowns();
    });
  } else {
    initDesktopPublicDropdowns();
    initMobilePublicDropdowns();
  }
})();
