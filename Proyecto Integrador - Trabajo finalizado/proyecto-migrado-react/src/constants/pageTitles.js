import { LIST_CONFIG } from './contentTypes';

export const DEFAULT_DOCUMENT_TITLE = 'Necochea Turismo';

const STATIC_TITLES = {
  '/': DEFAULT_DOCUMENT_TITLE,
  '/hub': 'Hub de contenidos — necochea.tur.ar',
  '/login': 'Iniciar sesión — necochea.tur.ar',
};

Object.values(LIST_CONFIG).forEach((config) => {
  STATIC_TITLES[config.path] = `${config.title} — necochea.tur.ar`;
});

export function titleForPath(pathname) {
  if (pathname.startsWith('/detalle/')) return null;
  if (STATIC_TITLES[pathname]) return STATIC_TITLES[pathname];
  if (pathname.startsWith('/admin')) return 'Panel de administración — necochea.tur.ar';
  if (pathname.startsWith('/usuario')) return 'Mi panel — necochea.tur.ar';
  return DEFAULT_DOCUMENT_TITLE;
}
