import { useEffect, useState } from 'react';
import { fetchMovimientos } from '../../api/adminApi';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';

function formatFecha(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function badgeAccion(accion) {
  const map = {
    crear: 'admin-badge admin-badge--user',
    editar: 'admin-badge admin-badge--admin',
    eliminar: 'admin-badge',
  };
  return <span className={map[accion] || 'admin-badge'}>{accion}</span>;
}

export default function AdminMovimientosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMovimientos()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="inner-page page-admin-panel">
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            <BreadcrumbLink to="/admin">Panel admin</BreadcrumbLink>
            <span>Registro de movimientos</span>
          </>
        }
        title="Registro de movimientos"
        subtitle="Historial de creaciones, ediciones y eliminaciones realizadas en el sistema"
      />
      <section className="section">
        <div className="container admin-panel-block">
          {error && <p className="admin-alert">{error}</p>}
          <div className="admin-table-wrap">
            <table className="admin-table" aria-label="Registro de movimientos">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Elemento</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="admin-table-loading">
                      Cargando movimientos…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      No hay movimientos registrados todavía.
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((m) => (
                    <tr key={m.id_movimiento}>
                      <td>{formatFecha(m.creado_en)}</td>
                      <td>
                        <strong>{m.usuario_nombre}</strong>
                        <div className="admin-muted">@{m.usuario_login}</div>
                      </td>
                      <td>{badgeAccion(m.accion)}</td>
                      <td>{m.entidad}</td>
                      <td>
                        {m.entidad_titulo || '—'}
                        {m.entidad_id != null && (
                          <span className="admin-muted"> #{m.entidad_id}</span>
                        )}
                      </td>
                      <td>{m.detalle || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
