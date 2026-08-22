import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchDetail } from '../../api/publicApi';
import DetailGallery from '../../components/carousel/DetailGallery';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatFechaLarga } from '../../utils/format';
import { itemImages } from '../../utils/images';

const SECTION_META = {
  noticia: { list: '/noticias', label: 'Noticias', bodyClass: 'page-detalle-noticias' },
  servicio: { list: '/servicios', label: 'Servicios', bodyClass: 'page-detalle-servicios' },
  que_hacer: { list: '/que-hacer', label: 'Qué Hacer', bodyClass: 'page-detalle-que-hacer' },
  que_visitar: { list: '/que-visitar', label: 'Qué Visitar', bodyClass: 'page-detalle-que-visitar' },
};

function buildContactItems(tipo, item) {
  const items = [];
  if (item?.contacto) {
    items.push({ label: 'Contacto:', value: item.contacto });
  }
  if (tipo === 'noticia' && item?.direccion) {
    items.push({ label: 'Dirección:', value: item.direccion });
  }
  return items;
}

export default function DetailPage() {
  const { tipo, id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const meta = SECTION_META[tipo];

  useEffect(() => {
    const bodyClass = meta?.bodyClass;
    if (!bodyClass) return undefined;
    document.body.classList.add('inner-page', bodyClass);
    return () => {
      document.body.classList.remove('inner-page', bodyClass);
    };
  }, [meta?.bodyClass]);

  useEffect(() => {
    if (!meta) {
      setError('Tipo de contenido no válido');
      setItem(null);
      return;
    }
    setItem(null);
    setError(null);
    fetchDetail(tipo, id)
      .then(setItem)
      .catch((err) => setError(err.message || 'No se encontró el contenido solicitado'));
  }, [tipo, id, meta]);

  const images = useMemo(() => (item ? itemImages(item) : []), [item]);
  const contactItems = useMemo(() => buildContactItems(tipo, item), [tipo, item]);

  const pageTitle = error
    ? 'Contenido no encontrado — necochea.tur.ar'
    : item?.nombre
      ? `${item.nombre} — necochea.tur.ar`
      : 'Cargando… — necochea.tur.ar';
  useDocumentTitle(pageTitle);

  const titleText = error || item?.nombre || 'Cargando…';
  const breadcrumbCurrent = error ? 'Error' : item?.nombre || 'Cargando…';

  return (
    <section className="section">
      <div className="container">
        <div className="detail-breadcrumb">
          <Link to="/">Inicio</Link>
          {' › '}
          {meta ? (
            <>
              <Link to={meta.list}>{meta.label}</Link>
              {' › '}
            </>
          ) : null}
          <span id="detail-breadcrumb-current">{breadcrumbCurrent}</span>
        </div>

        <div className="detail-main-grid">
          <div className="detail-main-left">
            <div className="detail-title-banner">
              <h1 className="detail-title-text" id="detail-title-text">
                {titleText}
              </h1>
            </div>
            <div className="detail-desc-block" id="detail-desc-block">
              {error ? (
                <p>{error}</p>
              ) : !item ? (
                <>
                  <h2>Descripción</h2>
                  <p>Cargando contenido…</p>
                </>
              ) : (
                <>
                  <h2>Descripción</h2>
                  {tipo === 'noticia' && item.fecha && (
                    <p>
                      <strong>{formatFechaLarga(item.fecha)}</strong>
                    </p>
                  )}
                  {item.descripcion && <p>{item.descripcion}</p>}
                  {item.info && (
                    <p>
                      {item.info.split('\n').map((line, i, arr) => (
                        <span key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  )}
                  {tipo === 'noticia' && item.direccion && (
                    <p>
                      <strong>Lugar:</strong> {item.direccion}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="detail-main-right">
            <DetailGallery images={images} alt={item?.nombre} />
          </div>

          <div className="detail-contact-row">
            <div className="detail-contact-block" hidden={contactItems.length === 0}>
              <h2>Información de contacto</h2>
              <ul className="detail-contact-list" id="detail-contact-list">
                {contactItems.map((entry) => (
                  <li key={entry.label}>
                    <strong>{entry.label}</strong> {entry.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
