import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentForm from '../../components/forms/ContentForm';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';
import { createContent } from '../../api/contentApi';

const TABS = [
  { id: 'noticia', label: 'Noticias', color: '#EF5EA5' },
  { id: 'servicio', label: 'Servicios', color: '#CC753F' },
  { id: 'que_hacer', label: 'Qué Hacer', color: '#9DC138' },
  { id: 'que_visitar', label: 'Qué Visitar', color: '#8CD4EF' },
];

const REDIRECT = {
  noticia: '/admin/gestion/noticias?creado=1',
  servicio: '/admin/gestion/servicios?creado=1',
  que_hacer: '/admin/gestion/que-hacer?creado=1',
  que_visitar: '/admin/gestion/que-visitar?creado=1',
};

export default function AdminCreatePage({ soloNoticia = false }) {
  const [tab, setTab] = useState('noticia');
  const navigate = useNavigate();
  const active = soloNoticia ? 'noticia' : tab;

  const handleSubmit = async (fd) => {
    await createContent(active, fd);
    navigate(soloNoticia ? '/usuario/mis-noticias?creado=1' : REDIRECT[active]);
  };

  return (
    <div className="inner-page page-formulario page-admin-panel">
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            <BreadcrumbLink to={soloNoticia ? '/usuario/mis-noticias' : '/admin'}>
              {soloNoticia ? 'Mis noticias' : 'Panel admin'}
            </BreadcrumbLink>
            <span>Cargar contenido</span>
          </>
        }
        title="Cargar contenido"
        subtitle="Seleccioná el tipo de contenido que deseas subir"
      />
      <section className="section">
        <div className="container">
          {!soloNoticia && (
            <div className="form-type-selector">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`form-type-btn${tab === t.id ? ' active' : ''}`}
                  onClick={() => setTab(t.id)}
                  style={{ borderBottomColor: t.color }}
                >
                  <span className="form-type-label">{t.label}</span>
                </button>
              ))}
            </div>
          )}
          <ContentForm key={active} tipo={active} onSubmit={handleSubmit} />
        </div>
      </section>
    </div>
  );
}
