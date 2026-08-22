import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/siteConfig';

const ALUMNOS = [
  {
    nombre: 'Juan B. Moreno',
    instagram: 'https://www.instagram.com/juann_mrn',
  },
  {
    nombre: 'Santiago V. Vallejos',
    instagram: 'https://www.instagram.com/santiago15vallejos',
  },
];

export default function Footer() {
  const { social } = siteConfig;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <img src="/img/logo.png" alt="Necochea Turismo" decoding="async" />
            </div>
            <div className="footer-desc">
              Secretaría de Turismo de Necochea. Destino turístico de la costa atlántica bonaerense. Mar,
              naturaleza y cultura.
            </div>
            <br />
            <br />
            <br />
            <div className="footer-socials" aria-label="Redes sociales">
              <a className="f-social" href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                <img src="/img/iconos/redes/facebook.png" alt="" decoding="async" role="presentation" />
              </a>
              <a className="f-social" href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <img src="/img/iconos/redes/instagram.png" alt="" decoding="async" role="presentation" />
              </a>
              <a className="f-social" href={social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                <img src="/img/iconos/redes/youtube.png" alt="" decoding="async" role="presentation" />
              </a>
              <a className="f-social" href={social.twitter} target="_blank" rel="noreferrer" aria-label="Twitter / X">
                <img src="/img/iconos/redes/twiter.png" alt="" decoding="async" role="presentation" />
              </a>
              <a className="f-social" href={social.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
                <img src="/img/iconos/redes/tik_tok.png" alt="" decoding="async" role="presentation" />
              </a>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Navegación</div>
            <Link className="footer-link" to="/">Inicio</Link>
            <Link className="footer-link" to="/que-visitar">Qué Visitar</Link>
            <Link className="footer-link" to="/servicios">Servicios</Link>
            <Link className="footer-link" to="/que-hacer">Qué Hacer</Link>
            <Link className="footer-link" to="/noticias">Noticias</Link>
            <Link className="footer-link" to="/hub">Hub</Link>
          </div>
          <div>
            <div className="footer-col-title">Contacto</div>
            <a className="footer-link" href="https://maps.app.goo.gl/sLsSgxBqdtAL6bMn6" target="_blank" rel="noreferrer">
              📍 Necochea, Buenos Aires
            </a>
            <a className="footer-link" href="#">📞 (02262) 431153 / 425665</a>
            <a
              className="footer-link"
              href="mailto:turismo@necochea.gob.ar?body=Hola%20Necochea%20Turismo,%20Tengo%20una%20duda%20sobre:"
            >
              ✉ turismo@necochea.gob.ar
            </a>
            <div style={{ marginTop: 14 }}>
              <div className="footer-col-title">WhatsApp</div>
              <a className="footer-link" href={siteConfig.whatsapp} target="_blank" rel="noreferrer">
                +54 9 2262 431-153
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2025 Necochea Turismo — Municipalidad de Necochea — Todos los derechos reservados</span>
          <Link className="footer-copy" to="/login">
            Iniciar sesion
          </Link>
          <span className="footer-badge">necochea.tur.ar</span>
        </div>
        <div className="footer-credits">
          <p className="footer-credits-line">
            Alumnos de la UTN Extensión áulica Necochea. Trabajo Integrador de último año.{' '}
            <span className="footer-alumnos-label">Alumnos:</span>{' '}
            {ALUMNOS.map((alumno, index) => (
              <span key={alumno.nombre} className="footer-alumno-item">
                {index > 0 && <span className="footer-alumno-sep" aria-hidden="true"> · </span>}
                <a
                  className="footer-alumno-ig"
                  href={alumno.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Instagram de ${alumno.nombre}`}
                >
                  <img src="/img/iconos/redes/instagram.png" alt="" decoding="async" role="presentation" />
                </a>
                <span>{alumno.nombre}</span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
