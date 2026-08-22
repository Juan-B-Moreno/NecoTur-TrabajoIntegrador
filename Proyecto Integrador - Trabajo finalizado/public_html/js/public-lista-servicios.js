document.addEventListener('DOMContentLoaded', () => {
  window.PublicSite.initListaPaginada({
    tipo: 'servicio',
    filtrosContainerId: 'lista-filtros',
    filtrosOptions: window.FiltrosForm.SERVICIO,
  });
});
