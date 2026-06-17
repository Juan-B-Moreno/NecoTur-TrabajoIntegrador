/*
  public-lista-que-hacer.js
  ---------------------------
  Inicializador para paginas de listado paginado. Llama a `PublicSite.initListaPaginada`.
*/
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa la lista paginada de "Qué hacer" con configuracion por defecto
  window.PublicSite.initListaPaginada({ tipo: 'que_hacer' });
});
