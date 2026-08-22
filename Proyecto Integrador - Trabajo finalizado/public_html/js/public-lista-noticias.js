document.addEventListener('DOMContentLoaded', () => {
  window.PublicSite.initListaPaginada({
    tipo: 'noticia',
    filtrosContainerId: 'lista-filtros',
    filtrosOptions: window.FiltrosForm.NOTICIA,
  });
});
