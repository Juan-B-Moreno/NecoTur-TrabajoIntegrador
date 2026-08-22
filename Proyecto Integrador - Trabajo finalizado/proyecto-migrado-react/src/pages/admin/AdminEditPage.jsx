import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchContentItem, updateContent } from '../../api/contentApi';
import ContentForm from '../../components/forms/ContentForm';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';
import { parseImageList } from '../../utils/images';

const REDIRECT = {
  noticia: '/admin/gestion/noticias?actualizado=1',
  servicio: '/admin/gestion/servicios?actualizado=1',
  que_hacer: '/admin/gestion/que-hacer?actualizado=1',
  que_visitar: '/admin/gestion/que-visitar?actualizado=1',
};

export default function AdminEditPage({ userMode = false }) {
  const { tipo: tipoParam, id } = useParams();
  const tipo = userMode ? 'noticia' : tipoParam;
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContentItem(tipo, id)
      .then((data) => setItem({ ...data, id, img_urls: parseImageList(data) }))
      .catch((err) => setError(err.message));
  }, [tipo, id]);

  const handleSubmit = async (fd) => {
    await updateContent(tipo, id, fd);
    if (userMode) navigate('/usuario/mis-noticias?actualizado=1');
    else navigate(REDIRECT[tipo] || '/admin');
  };

  if (error) return <div className="container">{error}</div>;
  if (!item) return <div className="container">Cargando…</div>;

  return (
    <div className="inner-page page-formulario page-admin-panel">
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            <BreadcrumbLink to={userMode ? '/usuario/mis-noticias' : '/admin'}>Panel</BreadcrumbLink>
            <span>Editar</span>
          </>
        }
        title="Editar contenido"
      />
      <section className="section">
        <div className="container">
          <ContentForm tipo={tipo} initial={item} onSubmit={handleSubmit} submitLabel="Guardar cambios" />
        </div>
      </section>
    </div>
  );
}
