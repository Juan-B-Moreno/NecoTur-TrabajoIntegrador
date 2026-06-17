/*
  public-detalle.js
  ------------------
  Carga un detalle unico segun `body.dataset.tipo` y `?id=`.
  - Rellena elementos como `#detail-title-text`, `#detail-breadcrumb-current`,
    `#detail-desc-block`, `#detailSlides`, `#detail-contact-list`.
  - Usa `window.PublicSite.fetchDetail` y helpers para renderizar imágenes.
*/
document.addEventListener('DOMContentLoaded', async () => {
  const tipo = document.body.dataset.tipo;
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id'));

  if (!tipo || !id) {
    showError('Enlace inválido');
    return;
  }

  const { fetchDetail, esc, formatFechaLarga, imagenHtml, itemImages } = window.PublicSite;

  try {
    // Obtiene datos del detalle desde la API
    const item = await fetchDetail(tipo, id);
    fillDetalle(tipo, item);
  } catch (err) {
    console.error(err);
    showError('No se encontró el contenido solicitado');
  }

  // Muestra mensaje de error en la página
  function showError(msg) {
    const title = document.getElementById('detail-title-text');
    if (title) title.textContent = msg;
    const desc = document.getElementById('detail-desc-block');
    if (desc) desc.innerHTML = `<p>${esc(msg)}</p>`;
  }

  // Rellena todos los elementos de la página con datos del item
  function fillDetalle(tipo, item) {
    const nombre = item.nombre || 'Sin título';
    document.title = `${nombre} — necochea.tur.ar`;

    // Rellena el titulo y breadcrumb
    const titleEl = document.getElementById('detail-title-text');
    if (titleEl) titleEl.textContent = nombre;

    const crumb = document.getElementById('detail-breadcrumb-current');
    if (crumb) crumb.textContent = nombre;

    // Rellena la seccion de descripcion con información del item
    const descBlock = document.getElementById('detail-desc-block');
    if (descBlock) {
      let html = '<h2>Descripción</h2>';
      if (tipo === 'noticia' && item.fecha) {
        html += `<p><strong>${esc(formatFechaLarga(item.fecha))}</strong></p>`;
      }
      if (item.descripcion) {
        html += `<p>${esc(item.descripcion)}</p>`;
      }
      if (item.info) {
        html += `<p>${esc(item.info).replace(/\n/g, '<br>')}</p>`;
      }
      if (tipo === 'noticia' && item.direccion) {
        html += `<p><strong>Lugar:</strong> ${esc(item.direccion)}</p>`;
      }
      descBlock.innerHTML = html;
    }

    // Rellena lista de contacto/direccion si existen datos
    const contactList = document.getElementById('detail-contact-list');
    if (contactList) {
      const items = [];
      if (item.contacto) items.push(`<li><strong>Contacto:</strong> ${esc(item.contacto)}</li>`);
      if (tipo === 'noticia' && item.direccion) {
        items.push(`<li><strong>Dirección:</strong> ${esc(item.direccion)}</li>`);
      }
      if (items.length) {
        contactList.innerHTML = items.join('');
        const contactBlock = contactList.closest('.detail-contact-block');
        if (contactBlock) contactBlock.hidden = false;
      } else {
        const contactBlock = contactList.closest('.detail-contact-block');
        if (contactBlock) contactBlock.hidden = true;
      }
    }

    // Renderiza galeria de imagenes con carrusel
    const slides = document.getElementById('detailSlides');
    const dots = document.querySelector('.detail-dots');
    const arrows = document.querySelector('.detail-arrows');
    const urls = itemImages(item);

    if (slides) {
      if (urls.length) {
        slides.innerHTML = urls
          .map(
            (url) =>
              `<div class="detail-slide">${imagenHtml(url, nombre, '#e8e8e8')}</div>`
          )
          .join('');

        // Si hay solo 1 imagen, no muestra puntos ni flechas de navegacion
        if (urls.length <= 1) {
          if (dots) dots.hidden = true;
          if (arrows) arrows.hidden = true;
        } else if (dots) {
          dots.hidden = false;
          dots.innerHTML = urls
            .map(
              (_, i) =>
                `<button type="button" class="detail-dot${i === 0 ? ' active' : ''}" onclick="detailGoSlide(${i})" aria-label="Foto ${i + 1}"></button>`
            )
            .join('');
          if (arrows) arrows.hidden = false;
        }
      } else {
        // Si no hay imagenes, muestra un espacio vacio
        slides.innerHTML =
          '<div class="detail-slide"><div style="width:100%;height:280px;background:#e8e8e8;"></div></div>';
        if (dots) dots.hidden = true;
        if (arrows) arrows.hidden = true;
      }
    }
  }
});
