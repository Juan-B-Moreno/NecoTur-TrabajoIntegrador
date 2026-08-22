import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Panel principal' },
  { to: '/admin/crear', label: 'Cargar contenido' },
  { to: '/admin/gestion/noticias', label: 'Gestionar noticias' },
  { to: '/admin/gestion/servicios', label: 'Gestionar servicios' },
  { to: '/admin/gestion/que-hacer', label: 'Gestionar qué hacer' },
  { to: '/admin/gestion/que-visitar', label: 'Gestionar qué visitar' },
  { to: '/admin/usuarios/crear', label: 'Crear usuario' },
  { to: '/admin/gestion/usuarios', label: 'Gestionar usuarios' },
  { to: '/admin/filtros', label: 'Gestionar filtros' },
  { to: '/admin/movimientos', label: 'Registro de movimientos' },
];

const USER_LINKS = [
  { to: '/usuario/crear', label: 'Cargar noticia' },
  { to: '/usuario/mis-noticias', label: 'Mis noticias' },
];

export default function AdminNavbar() {
  const { user, logout, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  const links = isAdmin ? ADMIN_LINKS : USER_LINKS;

  useEffect(() => {
    setMenuOpen(false);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      window.location.href = '/login';
    } catch {
      alert('No se pudo cerrar sesión. Intentá de nuevo.');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <div className="nav-logo">
          <Link to="/">
            <img src="/img/logo.png" alt="Logo Necochea Turismo" />
          </Link>
        </div>

        <div className="admin-welcome-bar">
          <div className="admin-welcome-inner container">
            <div className="welcome-text">
              Bienvenido: <span className="welcome-text-span">{user?.nombre || user?.usuario}</span>
            </div>
          </div>
        </div>

        <div className="nav-cta">
          <div className="nav-item nav-item-admin" id="navAdminWrap" ref={wrapRef}>
            <button
              type="button"
              className="nav-admin-toggle"
              id="adminMenuToggle"
              aria-label="Menú de administración"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="nav-admin-burger" aria-hidden="true">
                <span className="ham-line" style={{ width: 18 }} />
                <span className="ham-line" style={{ width: 14 }} />
                <span className="ham-line" style={{ width: 18 }} />
              </span>
              <span className="nav-admin-label">Admin</span>
            </button>
            <div className={`dropdown admin-dropdown${open ? ' open' : ''}`} id="adminDropdown">
              {links.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <button type="button" className="admin-dropdown-logout" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        <div
          className={`nav-hamburger${menuOpen ? ' open' : ''}`}
          id="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          role="button"
          tabIndex={0}
          aria-label="Menú móvil"
          onKeyDown={(e) => e.key === 'Enter' && setMenuOpen((o) => !o)}
        >
          <div className="ham-line" style={{ width: 22 }} />
          <div className="ham-line" style={{ width: 16 }} />
          <div className="ham-line" style={{ width: 22 }} />
        </div>
      </div>

      <div className={`mob-menu${menuOpen ? ' open' : ''}`} id="mobMenu">
        <div className="mob-menu-inner">
          <Link className="mob-item" to="/" onClick={() => setMenuOpen(false)}>
            <span>Inicio</span>
            <span className="arr">›</span>
          </Link>
          <div className="mob-admin-block">
            <div className="mob-admin-title">Administración</div>
            {links.map((link) => (
              <Link
                key={link.to}
                className={`mob-item${pathname === link.to || pathname.startsWith(`${link.to}/`) ? ' active' : ''}`}
                to={link.to}
                onClick={() => setMenuOpen(false)}
              >
                <span>{link.label}</span>
                <span className="arr">›</span>
              </Link>
            ))}
            <button
              type="button"
              className="mob-item mob-item-logout"
              onClick={handleLogout}
            >
              <span>Cerrar sesión</span>
              <span className="arr">⎋</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
