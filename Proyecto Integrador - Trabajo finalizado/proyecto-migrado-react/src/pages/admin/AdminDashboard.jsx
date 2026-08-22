import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicacionesRecientes, fetchUsuarios } from '../../api/adminApi';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';

function esc(text) {
  if (text == null || text === '') return '—';
  return String(text);
}

function badgeRol(rol) {
  const cls = rol === 'admin' ? 'admin-badge admin-badge--admin' : 'admin-badge admin-badge--user';
  return <span className={cls}>{esc(rol)}</span>;
}

function formatFecha(val) {
  if (!val || val === '1970-01-01T00:00:00.000Z') return '—';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return esc(val);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return esc(val);
  }
}

function creadorNombre(row) {
  if (row.creador_nombre) return esc(row.creador_nombre);
  if (row.creador_usuario) return esc(row.creador_usuario);
  return <span className="admin-muted">Sin asignar</span>;
}

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState(null);
  const [publicaciones, setPublicaciones] = useState(null);
  const [usuariosError, setUsuariosError] = useState('');
  const [pubError, setPubError] = useState('');

  useEffect(() => {
    fetchUsuarios()
      .then(setUsuarios)
      .catch((err) => setUsuariosError(err.message));
    fetchPublicacionesRecientes(20)
      .then((data) => setPublicaciones(data.publicaciones || []))
      .catch((err) => setPubError(err.message));
  }, []);

  return (
    <div className="inner-page page-admin-panel">
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            <span>Panel de administración</span>
          </>
        }
        title="Panel de administración"
        subtitle="Usuarios del sistema y últimas publicaciones en la plataforma"
      />
      <section className="section">
        <div className="container">
          <div className="admin-panel-block">
            <div className="sec-title-row">
              <h2 className="sec-title">Usuarios registrados</h2>
              <div className="sec-line-h" />
            </div>
            <div className="admin-toolbar">
              <Link to="/admin/usuarios/crear" className="btn btn-primary">+ Crear usuario</Link>
              <Link to="/admin/gestion/usuarios" className="btn btn-secondary">Gestionar / editar</Link>
            </div>
            {usuariosError && <p className="admin-alert">{usuariosError}</p>}
            <div className="admin-table-wrap">
              <table className="admin-table" aria-label="Lista de usuarios">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>DNI</th>
                    <th>Rol</th>
                    <th>ID</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios === null && !usuariosError && (
                    <tr>
                      <td colSpan={7} className="admin-table-loading">Cargando usuarios…</td>
                    </tr>
                  )}
                  {usuarios?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="admin-table-empty">No hay usuarios registrados.</td>
                    </tr>
                  )}
                  {usuarios?.map((u) => (
                    <tr key={u.id_usuario}>
                      <td>{esc(u.nombre)}</td>
                      <td><strong>{esc(u.usuario)}</strong></td>
                      <td>{esc(u.email)}</td>
                      <td>{esc(u.dni)}</td>
                      <td>{badgeRol(u.rol)}</td>
                      <td className="admin-muted">#{esc(u.id_usuario)}</td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/usuarios/editar/${u.id_usuario}`}
                          className="btn btn-primary btn-sm"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-panel-block" style={{ marginTop: 40 }}>
            <div className="sec-title-row">
              <h2 className="sec-title">Últimas publicaciones</h2>
              <div className="sec-line-h" />
            </div>
            <p className="admin-panel-hint">
              Noticias, qué visitar, servicios y qué hacer — últimas 20 por fecha de creación.
            </p>
            {pubError && <p className="admin-alert">{pubError}</p>}
            <div className="admin-table-wrap">
              <table className="admin-table" aria-label="Últimas publicaciones">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Título</th>
                    <th>Nombre del usuario</th>
                    <th>Fecha</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {publicaciones === null && !pubError && (
                    <tr>
                      <td colSpan={5} className="admin-table-loading">Cargando publicaciones…</td>
                    </tr>
                  )}
                  {publicaciones?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="admin-table-empty">No hay publicaciones todavía.</td>
                    </tr>
                  )}
                  {publicaciones?.map((p) => (
                    <tr key={`${p.tipo}-${p.id}`}>
                      <td><span className="admin-tipo">{esc(p.tipo)}</span></td>
                      <td>{esc(p.titulo)}</td>
                      <td>{creadorNombre(p)}</td>
                      <td>{formatFecha(p.fecha_orden)}</td>
                      <td className="admin-muted">#{esc(p.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
