import { useEffect, useState } from 'react';
import { createFiltroAdmin, deleteFiltroAdmin, fetchFiltrosAdmin } from '../../api/adminApi';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';

const SECCIONES = [
  { key: 'noticia', label: 'Noticias' },
  { key: 'servicio', label: 'Servicios' },
  { key: 'que_hacer', label: 'Qué Hacer' },
  { key: 'que_visitar', label: 'Qué Visitar' },
];

export default function AdminFiltrosPage() {
  const [seccion, setSeccion] = useState('noticia');
  const [filtros, setFiltros] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async (key = seccion) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFiltrosAdmin(key);
      setFiltros(data.filtros || []);
    } catch (err) {
      setError(err.message);
      setFiltros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(seccion);
  }, [seccion]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const nombre = nuevoNombre.trim();
    if (!nombre) {
      setError('Ingresá un nombre para el filtro.');
      return;
    }
    try {
      await createFiltroAdmin(seccion, nombre);
      setNuevoNombre('');
      setSuccess('Filtro creado correctamente.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el filtro «${nombre}»?`)) return;
    setError('');
    setSuccess('');
    try {
      await deleteFiltroAdmin(id);
      setSuccess('Filtro eliminado.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="inner-page page-admin-panel">
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            <BreadcrumbLink to="/admin">Panel admin</BreadcrumbLink>
            <span>Gestionar filtros</span>
          </>
        }
        title="Gestionar filtros"
        subtitle="Creá y administrá los filtros que aparecen en las listas públicas y al cargar contenido."
        lineColor="#8161AF"
      />
      <section className="section">
        <div className="container">
          <div className="admin-filtros-tabs">
            {SECCIONES.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`filter-btn${seccion === s.key ? ' active' : ''}`}
                onClick={() => setSeccion(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {error && <p className="admin-alert">{error}</p>}
          {success && <p className="admin-alert admin-alert--ok">{success}</p>}

          <form className="admin-filtros-form" onSubmit={handleCreate}>
            <input
              type="text"
              className="form-input"
              placeholder="Nombre del nuevo filtro"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              maxLength={80}
            />
            <button type="submit" className="btn btn-primary">
              Agregar filtro
            </button>
          </form>

          {loading ? (
            <p className="lista-empty">Cargando filtros…</p>
          ) : filtros.length === 0 ? (
            <p className="lista-empty">No hay filtros en esta sección. Agregá el primero arriba.</p>
          ) : (
            <ul className="admin-filtros-list">
              {filtros.map((f) => (
                <li key={f.id_filtro} className="admin-filtros-item">
                  <span>{f.nombre}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDelete(f.id_filtro, f.nombre)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
