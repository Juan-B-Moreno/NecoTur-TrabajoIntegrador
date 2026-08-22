import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchList, fetchRandomList } from '../../api/publicApi';
import ContentCard from '../../components/cards/ContentCard';
import HeroCarousel from '../../components/carousel/HeroCarousel';
import { useClima } from '../../hooks/useClima';

function formatUpdated(iso) {
  if (!iso) return 'Actualizado recientemente';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Actualizado recientemente';
  return `Actualizado ${d.toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
}

export default function HomePage() {
  const { clima, actualizado, stale, error: climaError } = useClima();
  const [visitar, setVisitar] = useState([]);
  const [hacer, setHacer] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setLoadError('');
    Promise.all([
      fetchRandomList('que_visitar', 3),
      fetchRandomList('que_hacer', 3),
      fetchList('noticia', 3, 0),
    ])
      .then(([v, h, n]) => {
        setVisitar(v.items);
        setHacer(h.items);
        setNoticias(n.items);
      })
      .catch((err) => setLoadError(err.message || 'No se pudo cargar el contenido del inicio.'));
  }, []);

  const extras = [];
  if (clima?.humedad != null) extras.push(`💧 Humedad: ${clima.humedad}%`);
  if (clima?.vientoKmh != null) {
    const dir = clima.vientoDireccion ? ` ${clima.vientoDireccion}` : '';
    extras.push(`🌬 Viento: ${clima.vientoKmh} km/h${dir}`);
  }
  if (clima?.sensacion != null) extras.push(`☀️ Sensación: ${clima.sensacion}°C`);

  return (
    <>
      <HeroCarousel />

      {(loadError || climaError) && (
        <div className="container" style={{ padding: '12px 20px 0' }}>
          {loadError && <p className="admin-alert">{loadError}</p>}
          {climaError && !loadError && (
            <p className="admin-alert">No se pudo cargar el clima: {climaError}</p>
          )}
        </div>
      )}

      <div className="cats-section">
        <div className="container">
          <nav className="cats-grid" aria-label="Categorías según iconos">
            {[
              ['alojamiento', 'Alojamiento', 'alojamiento'],
              ['alquiler_autos', 'Alquiler de Autos', 'alquiler de autos'],
              ['balneario', 'Balneario', 'balneario'],
              ['farmacia', 'Farmacia', 'farmacia'],
              ['gastronomia', 'Gastronomía', 'gastronomia'],
              ['transporte', 'Transporte', 'transporte'],
              ['telefonos_utiles', 'Teléfonos útiles', 'telefonos utiles'],
            ].map(([icon, name, filtro]) => (
              <Link
                key={icon}
                className="cat-btn"
                to={`/servicios?filtro=${encodeURIComponent(filtro)}`}
              >
                <span className="cat-icon">
                  <img src={`/img/iconos/${icon}.png`} decoding="async" alt="" role="presentation" />
                </span>
                <span className="cat-name">{name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-title">Qué Visitar</div>
            <Link className="section-ver" to="/que-visitar">Ver todos →</Link>
          </div>
          <div className="section-sub">Los lugares imperdibles de Necochea y sus alrededores</div>
          <div className="section-line" style={{ background: '#8161AF' }} />
          <div className="cards-grid" id="home-visitar-grid">
            {visitar.map((item) => (
              <ContentCard key={item.id} item={item} tipo="que_visitar" variant="home" />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <div className="section-title">Qué Hacer</div>
            <Link className="section-ver" to="/que-hacer">Ver todos →</Link>
          </div>
          <div className="section-sub">Actividades y experiencias para todos los gustos</div>
          <div className="section-line" style={{ background: '#9DC138' }} />
          <div className="cards-grid" id="home-hacer-grid">
            {hacer.map((item) => (
              <ContentCard key={item.id} item={item} tipo="que_hacer" variant="home" />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div className="section-title">Clima en Necochea</div>
            <div id="clima-updated" style={{ fontSize: 11, color: '#aaa' }}>
              {formatUpdated(actualizado)}{stale ? ' (últimos datos disponibles)' : ''}
            </div>
          </div>
          <div className="clima-box">
            <div className="clima-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="#8CD4EF" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <div>
              <div className="clima-city">Necochea, Buenos Aires, Argentina</div>
              <div className="clima-temp" id="clima-temp">
                {clima?.temperatura != null ? `${Math.round(clima.temperatura * 10) / 10}°C` : '—'}
              </div>
              <div className="clima-desc" id="clima-desc">
                {climaError
                  ? 'Datos de clima no disponibles'
                  : clima?.descripcion || 'Obteniendo datos…'}
              </div>
              <div className="clima-extras" id="clima-extras">
                {extras.map((t) => (
                  <div key={t} className="clima-extra">{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <div className="section-title">Noticias</div>
            <Link className="section-ver" to="/noticias">Ver todas →</Link>
          </div>
          <div className="section-sub">Novedades, eventos y actualidad turística de Necochea</div>
          <div className="section-line" style={{ background: '#EF5EA5' }} />
          <div className="news-grid" id="home-noticias-grid">
            {noticias.map((item) => (
              <ContentCard key={item.id} item={item} tipo="noticia" variant="home" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
