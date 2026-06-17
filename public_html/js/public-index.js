/*
  public-index.js
  ----------------
  Inicializador de la pagina principal. Usa `window.PublicSite` para cargar
  las grids destacadas en `home-visitar-grid`, `home-hacer-grid` y `home-noticias-grid`.
*/
document.addEventListener('DOMContentLoaded', () => {
  const { loadIntoGrid, cardVisitarHome, cardHacerHome, cardNoticiaHome } = window.PublicSite;

  // Carga las grillas destacadas en la homepage
  loadIntoGrid('home-visitar-grid', 'que_visitar', 3, cardVisitarHome);
  loadIntoGrid('home-hacer-grid', 'que_hacer', 3, cardHacerHome);
  loadIntoGrid('home-noticias-grid', 'noticia', 3, cardNoticiaHome);

  // Enlaza botones "Ver todos" a sus paginas correspondientes
  document.querySelectorAll('[data-ver-todos]').forEach((el) => {
    const href = el.getAttribute('data-href');
    if (href) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        window.location.href = href;
      });
    }
  });
});
