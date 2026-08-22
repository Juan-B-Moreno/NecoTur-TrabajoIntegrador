import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AdminTable from '../../components/admin/AdminTable';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';
import { GESTION_CONFIGS } from '../../constants/contentTypes';
import { fetchContentList, fetchMisNoticias } from '../../api/contentApi';
import { fetchUsuarios } from '../../api/adminApi';

function buildOkMessage(searchParams, { misNoticias, isUsuarios }) {
  if (searchParams.get('creado') === '1') {
    if (isUsuarios) return 'Usuario creado correctamente.';
    if (misNoticias) return 'Noticia publicada correctamente.';
    return 'Contenido publicado correctamente.';
  }
  if (searchParams.get('actualizado') === '1') {
    if (isUsuarios) return 'Usuario actualizado correctamente.';
    if (misNoticias) return 'Noticia actualizada correctamente.';
    return 'Contenido actualizado correctamente.';
  }
  if (searchParams.get('eliminado') === '1') {
    if (isUsuarios) return 'Usuario eliminado correctamente.';
    if (misNoticias) return 'Noticia eliminada correctamente.';
    return 'Contenido eliminado correctamente.';
  }
  return '';
}

export default function AdminGestionPage({ misNoticias = false }) {
  const { seccion } = useParams();
  const [searchParams] = useSearchParams();
  const isUsuarios = seccion === 'usuarios';

  const config = misNoticias
    ? {
        ...GESTION_CONFIGS.noticias,
        title: 'Mis noticias',
        createPath: '/usuario/crear',
        editPath: '/usuario/editar/noticia',
        columns: [
          { key: 'nombre', label: 'Título' },
          { key: 'fecha', label: 'Fecha', format: 'date' },
        ],
      }
    : GESTION_CONFIGS[seccion];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const okMsg = buildOkMessage(searchParams, { misNoticias, isUsuarios });

  const newLabel = misNoticias ? '+ Nueva noticia' : '+ Nuevo';

  const load = () => {
    if (!config) return;
    setLoading(true);
    setError('');
    const promise = misNoticias
      ? fetchMisNoticias()
      : isUsuarios
        ? fetchUsuarios()
        : fetchContentList(null, config.apiList).then((d) => d[config.dataKey] || []);
    promise
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [seccion, misNoticias]);

  if (!config) return <div className="container">Sección no encontrada</div>;

  return (
    <div className="inner-page page-formulario page-admin-panel">
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            {!misNoticias && <BreadcrumbLink to="/admin">Panel admin</BreadcrumbLink>}
            <span>{config.title}</span>
          </>
        }
        title={config.title}
        lineColor={config.lineColor}
      />
      <section className="section">
        <div className="container admin-panel-block">
          <div className="admin-toolbar">
            <Link to={config.createPath} className="btn btn-primary">
              {newLabel}
            </Link>
            {!misNoticias && (
              <Link to="/admin" className="btn btn-secondary">
                Volver al panel
              </Link>
            )}
            {misNoticias && (
              <Link to="/" className="btn btn-secondary">
                Volver al sitio
              </Link>
            )}
          </div>
          {okMsg && <p className="admin-alert admin-alert--ok">{okMsg}</p>}
          {error && <p className="admin-alert">{error}</p>}
          <AdminTable config={config} rows={rows} loading={loading} onDeleted={load} />
        </div>
      </section>
    </div>
  );
}
