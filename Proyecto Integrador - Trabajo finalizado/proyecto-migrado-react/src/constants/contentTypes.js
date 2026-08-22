export const FILTROS_NOTICIA = ['Necochea', 'Quequen', 'Playa', 'Parque', 'Actividades'];
export const FILTROS_SERVICIO = ['Bar', 'Restaurantes', 'Hoteles', 'Cochera', 'Balneario'];

export const API_PATHS = {
  noticia: 'noticias',
  servicio: 'servicios',
  que_hacer: 'que-hacer',
  que_visitar: 'que-visitar',
};

export const ITEMS_KEYS = {
  noticia: 'noticias',
  servicio: 'servicios',
  que_hacer: 'actividades',
  que_visitar: 'lugares',
};

export const DETAIL_KEYS = {
  noticia: 'noticia',
  servicio: 'servicio',
  que_hacer: 'actividad',
  que_visitar: 'lugar',
};

export const LIST_CONFIG = {
  noticia: {
    tipo: 'noticia',
    title: 'Noticias',
    subtitle: 'Novedades, eventos y actualidad turística de Necochea',
    lineColor: '#EF5EA5',
    path: '/noticias',
    gridClass: 'news-grid',
    hasFiltros: true,
  },
  servicio: {
    tipo: 'servicio',
    title: 'Servicios',
    subtitle: 'Alojamiento, gastronomía, balnearios y más',
    lineColor: '#8161AF',
    path: '/servicios',
    gridClass: 'cards-grid',
    hasFiltros: true,
  },
  que_hacer: {
    tipo: 'que_hacer',
    title: 'Qué Hacer',
    subtitle: 'Actividades y experiencias para todos los gustos',
    lineColor: '#9DC138',
    path: '/que-hacer',
    gridClass: 'cards-grid',
    hasFiltros: true,
  },
  que_visitar: {
    tipo: 'que_visitar',
    title: 'Qué Visitar',
    subtitle: 'Los lugares imperdibles de Necochea y sus alrededores',
    lineColor: '#8CD4EF',
    path: '/que-visitar',
    gridClass: 'cards-grid',
    hasFiltros: true,
  },
};

export const GESTION_CONFIGS = {
  noticias: {
    apiList: '/api/noticias',
    apiBase: '/api/noticias',
    dataKey: 'noticias',
    idField: 'id_noticia',
    title: 'Gestionar noticias',
    lineColor: '#EF5EA5',
    createPath: '/admin/crear',
    editPath: '/admin/editar/noticia',
    columns: [
      { key: 'nombre', label: 'Título' },
      { key: 'fecha', label: 'Fecha', format: 'date' },
      { key: 'creador_nombre', label: 'Autor' },
    ],
  },
  servicios: {
    apiList: '/api/servicios',
    apiBase: '/api/servicios',
    dataKey: 'servicios',
    idField: 'id_servicio',
    title: 'Gestionar servicios',
    lineColor: '#8161AF',
    createPath: '/admin/crear',
    editPath: '/admin/editar/servicio',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'contacto', label: 'Contacto' },
    ],
  },
  'que-hacer': {
    apiList: '/api/que-hacer',
    apiBase: '/api/que-hacer',
    dataKey: 'actividades',
    idField: 'id_servicio',
    title: 'Gestionar qué hacer',
    lineColor: '#9DC138',
    createPath: '/admin/crear',
    editPath: '/admin/editar/que_hacer',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'contacto', label: 'Contacto' },
    ],
  },
  'que-visitar': {
    apiList: '/api/que-visitar',
    apiBase: '/api/que-visitar',
    dataKey: 'lugares',
    idField: 'id_lugar',
    title: 'Gestionar qué visitar',
    lineColor: '#8CD4EF',
    createPath: '/admin/crear',
    editPath: '/admin/editar/que_visitar',
    columns: [{ key: 'nombre', label: 'Nombre' }],
  },
  usuarios: {
    apiList: '/api/admin/usuarios',
    apiBase: '/api/admin/usuarios',
    dataKey: 'usuarios',
    idField: 'id_usuario',
    title: 'Gestionar usuarios',
    lineColor: '#8161AF',
    createPath: '/admin/usuarios/crear',
    editPath: '/admin/usuarios/editar',
    deleteConfirm: '¿Eliminar este usuario? Sus publicaciones quedarán sin autor asignado.',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'usuario', label: 'Usuario' },
      { key: 'rol', label: 'Rol' },
    ],
  },
};
