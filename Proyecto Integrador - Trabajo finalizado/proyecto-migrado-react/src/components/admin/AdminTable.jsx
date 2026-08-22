import { Link } from 'react-router-dom';
import { formatDateShort } from '../../utils/format';
import { deleteContent } from '../../api/contentApi';
import { deleteUsuario } from '../../api/adminApi';

export default function AdminTable({ config, rows, loading = false, onDeleted }) {
  const handleDelete = async (id) => {
    if (!window.confirm(config.deleteConfirm || '¿Eliminar este ítem?')) return;
    try {
      if (config.dataKey === 'usuarios') {
        await deleteUsuario(id);
      } else {
        const tipoMap = {
          noticias: 'noticia',
          servicios: 'servicio',
          actividades: 'que_hacer',
          lugares: 'que_visitar',
        };
        await deleteContent(tipoMap[config.dataKey] || 'noticia', id);
      }
      onDeleted?.();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {config.columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>ID</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="gestion-tbody">
          {loading && (
            <tr>
              <td colSpan={config.columns.length + 2} className="admin-table-loading">
                Cargando…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={config.columns.length + 2}>{config.emptyMsg || 'No hay registros.'}</td>
            </tr>
          )}
          {!loading &&
            rows.map((item) => {
            const id = item[config.idField];
            return (
              <tr key={id}>
                {config.columns.map((col) => (
                  <td key={col.key}>
                    {col.format === 'date' ? formatDateShort(item[col.key]) : item[col.key] || '—'}
                  </td>
                ))}
                <td className="admin-muted">#{id}</td>
                <td className="admin-actions-cell">
                  <Link className="btn btn-primary btn-sm" to={`${config.editPath}/${id}`}>
                    Editar
                  </Link>{' '}
                  <button type="button" className="btn btn-secondary btn-sm btn-delete" onClick={() => handleDelete(id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
