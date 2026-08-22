import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchList } from '../../api/publicApi';
import { siteConfig } from '../../config/siteConfig';

const MENU_SECTIONS = [
  { tipo: 'que_visitar', path: '/que-visitar', label: 'Qué Visitar' },
  { tipo: 'servicio', path: '/servicios', label: 'Servicios' },
  { tipo: 'que_hacer', path: '/que-hacer', label: 'Qué Hacer' },
];

const NAV_LINKS = [
  { to: '/', label: 'Inicio', exact: true },
  ...MENU_SECTIONS.map((s) => ({ to: s.path, label: s.label, dropdown: s.tipo })),
  { to: '/noticias', label: 'Noticias' },
  { to: '/hub', label: 'Hub' },
];

function isActive(pathname, to, exact) {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdowns, setDropdowns] = useState({});
  const [openMobile, setOpenMobile] = useState({});

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    Promise.all(
      MENU_SECTIONS.map(async (section) => {
        try {
          const { items } = await fetchList(section.tipo, 5, 0);
          return [section.tipo, items];
        } catch {
          return [section.tipo, []];
        }
      })
    ).then((entries) => setDropdowns(Object.fromEntries(entries)));
  }, []);

  const { social } = siteConfig;

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <div className="nav-logo">
          <Link to="/">
            <img src="/img/logo.png" alt="Logo Necochea Turismo" />
          </Link>
        </div>

        <div className="nav-links">
          {NAV_LINKS.map((link) =>
            link.dropdown ? (
              <div className="nav-item" key={link.to}>
                <Link className={`nav-link${isActive(pathname, link.to) ? ' active' : ''}`} to={link.to}>
                  {link.label} <span className="arrow">▾</span>
                </Link>
                <div className="dropdown">
                  {(dropdowns[link.dropdown] || []).map((item) => (
                    <Link key={item.id} to={`/detalle/${link.dropdown}/${item.id}`}>
                      {item.nombre}
                    </Link>
                  ))}
                  <Link to={link.to} style={{ color: '#8161AF', fontWeight: 700 }}>
                    Ver todos →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="nav-item" key={link.to}>
                <Link className={`nav-link${isActive(pathname, link.to, link.exact) ? ' active' : ''}`} to={link.to}>
                  {link.label}
                </Link>
              </div>
            )
          )}
        </div>

        <div className="nav-cta" aria-label="Redes sociales">
          {Object.entries(social).map(([key, href]) => (
            <a key={key} className="nav-social" href={href} target="_blank" rel="noreferrer" aria-label={key}>
              <img src={`/img/iconos/redes/${key === 'twitter' ? 'twiter' : key === 'tiktok' ? 'tik_tok' : key}.png`} alt="" decoding="async" role="presentation" />
            </a>
          ))}
        </div>

        <div className={`nav-hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen((o) => !o)} id="hamburger">
          <div className="ham-line" style={{ width: 22 }} />
          <div className="ham-line" style={{ width: 16 }} />
          <div className="ham-line" style={{ width: 22 }} />
        </div>
      </div>

      <div className={`mob-menu${menuOpen ? ' open' : ''}`} id="mobMenu">
        <div className="mob-menu-inner">
          {NAV_LINKS.map((link) =>
            link.dropdown ? (
              <div className="mob-submenu-group" key={link.to}>
                <button
                  type="button"
                  className={`mob-item mob-item-toggle${isActive(pathname, link.to) ? ' active' : ''}`}
                  aria-expanded={openMobile[link.to] ? 'true' : 'false'}
                  onClick={() => setOpenMobile((s) => ({ ...s, [link.to]: !s[link.to] }))}
                >
                  <span>{link.label}</span>
                  <span className="arr">▾</span>
                </button>
                <div className={`mob-submenu${openMobile[link.to] ? ' open' : ''}`}>
                  {(dropdowns[link.dropdown] || []).map((item) => (
                    <Link key={item.id} className="mob-subitem" to={`/detalle/${link.dropdown}/${item.id}`}>
                      {item.nombre}
                    </Link>
                  ))}
                  <Link className="mob-subitem mob-subitem-more" to={link.to}>
                    Ver más →
                  </Link>
                </div>
              </div>
            ) : (
              <Link key={link.to} className={`mob-item${isActive(pathname, link.to, link.exact) ? ' active' : ''}`} to={link.to}>
                {link.label} <span className="arr">›</span>
              </Link>
            )
          )}
          <div className="mob-socials" aria-label="Redes sociales">
            {Object.entries(social).map(([key, href]) => (
              <a key={key} className="mob-social" href={href} target="_blank" rel="noreferrer" aria-label={key}>
                <img src={`/img/iconos/redes/${key === 'twitter' ? 'twiter' : key === 'tiktok' ? 'tik_tok' : key}.png`} alt="" decoding="async" role="presentation" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
