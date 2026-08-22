/*
  public-lista-que-visitar.js
  -----------------------------
  Inicializador para páginas de listado paginado. Llama a `PublicSite.initListaPaginada`.
*/
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa la lista paginada de "Qué visitar" con configuración por defecto
  window.PublicSite.initListaPaginada({ tipo: 'que_visitar' });
});
