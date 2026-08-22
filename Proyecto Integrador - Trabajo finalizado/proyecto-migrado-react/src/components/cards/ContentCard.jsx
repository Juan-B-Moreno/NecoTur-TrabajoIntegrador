import { Link } from 'react-router-dom';
import { formatFecha, truncate } from '../../utils/format';
import { primaryImage } from '../../utils/images';

const CARD_STYLES = {
  noticia: {
    className: 'news-card',
    imgWrap: 'ns-img',
    imgBg: '#f0d8e8',
    cat: { bg: '#EF5EA528', color: '#8a1060', label: 'Noticias' },
    link: 'Leer más →',
    showDate: true,
  },
  servicio: {
    className: 'service-card',
    imgBg: '#e8e0f4',
    cat: { bg: '#8161AF28', color: '#4a2080', label: 'Servicio' },
    link: 'Ver más →',
    showContact: true,
  },
  que_visitar: {
    className: 'dest-card',
    imgBg: '#c8e8f4',
    cat: { bg: '#8CD4EF28', color: '#1a6080', label: 'Qué visitar' },
    link: 'Ver más →',
  },
  que_hacer: {
    className: 'hacer-card',
    imgBg: '#e8f4d0',
    cat: { bg: '#9DC13828', color: '#3a5810', label: 'Actividad' },
    link: 'Ver más →',
    showContact: true,
  },
};

function ImageBlock({ item, style, variant }) {
  const url = primaryImage(item);
  if (variant === 'home') {
    return (
      <div className="dest-img">
        {url ? (
          <img src={url} alt={item.nombre} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: style.imgBg, minHeight: 160 }} />
        )}
      </div>
    );
  }
  return (
    <div className="card-img" style={{ background: style.imgBg }}>
      {url ? (
        <img src={url} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: style.imgBg, minHeight: 180 }} />
      )}
    </div>
  );
}

export default function ContentCard({ item, tipo, variant = 'list' }) {
  const style = CARD_STYLES[tipo];
  if (!style) return null;

  const href = `/detalle/${tipo}/${item.id}`;

  if (variant === 'home' && tipo === 'noticia') {
    const url = primaryImage(item);
    return (
      <Link className="news-card" to={href}>
        <div className="news-img" style={{ background: '#f0d8e8' }}>
          {url && <img src={url} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div className="news-body">
          <div className="news-meta">
            <span className="news-tag" style={{ background: '#EF5EA528', color: '#8a1060' }}>
              Noticias
            </span>
            <span className="news-date">{formatFecha(item.fecha)}</span>
          </div>
          <div className="news-title">{item.nombre}</div>
          <div className="news-excerpt">{truncate(item.descripcion, 120)}</div>
        </div>
      </Link>
    );
  }

  if (variant === 'home') {
    return (
      <Link className={`dest-card${tipo === 'que_hacer' ? ' hacer-home-card' : ''}`} to={href}>
        <ImageBlock item={item} style={style} variant="home" />
        <div className="dest-body">
          <div className="dest-tag" style={{ background: style.cat.bg, color: style.cat.color }}>
            {tipo === 'que_visitar' ? 'Lugar' : 'Actividad'}
          </div>
          <div className="dest-name">{item.nombre}</div>
          <div className="dest-desc">{truncate(item.descripcion, 120)}</div>
          <div className="dest-link">Ver más →</div>
        </div>
      </Link>
    );
  }

  return (
    <Link className={style.className} to={href}>
      <ImageBlock item={item} style={style} />
      <div className="card-body">
        <div className="card-cat" style={{ background: style.cat.bg, color: style.cat.color }}>
          {style.cat.label}
        </div>
        <div className="card-name">{item.nombre}</div>
        {style.showDate && <div className="card-date">{formatFecha(item.fecha)}</div>}
        <div className="card-desc">{truncate(item.descripcion, 160)}</div>
        {style.showContact && item.contacto && (
          <div className="card-meta">
            <div className="card-meta-item">📞 {truncate(item.contacto, 40)}</div>
          </div>
        )}
        <div className="card-link">{style.link}</div>
      </div>
    </Link>
  );
}
