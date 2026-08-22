import { useState } from 'react';
import FiltrosCheckboxes from './FiltrosCheckboxes';
import ImageUploader from './ImageUploader';
import { appendFiltros, buildContentFormData } from '../../utils/formData';

const FORM_CONFIG = {
  noticia: {
    title: 'Noticia',
    icon: '📰',
    color: '#EF5EA5',
    fields: ['titulo', 'descripcion', 'info', 'fecha', 'direccion'],
    nameField: 'titulo',
    hasFiltros: true,
  },
  servicio: {
    title: 'Servicio',
    icon: '🛎',
    color: '#CC753F',
    fields: ['nombre', 'descripcion', 'info', 'contacto'],
    nameField: 'nombre',
    hasFiltros: true,
  },
  que_hacer: {
    title: 'Qué Hacer',
    icon: '🎯',
    color: '#9DC138',
    fields: ['nombre', 'descripcion', 'info', 'contacto'],
    nameField: 'nombre',
    hasFiltros: true,
  },
  que_visitar: {
    title: 'Qué Visitar',
    icon: '📍',
    color: '#8CD4EF',
    fields: ['nombre', 'descripcion', 'info'],
    nameField: 'nombre',
    hasFiltros: true,
  },
};

export default function ContentForm({ tipo, initial = {}, onSubmit, submitLabel = 'Publicar' }) {
  const cfg = FORM_CONFIG[tipo];
  const [form, setForm] = useState({
    titulo: initial.nombre || '',
    nombre: initial.nombre || '',
    descripcion: initial.descripcion || '',
    info: initial.info || '',
    fecha: initial.fecha ? String(initial.fecha).slice(0, 10) : '',
    direccion: initial.direccion || '',
    contacto: initial.contacto || '',
  });
  const [filtros, setFiltros] = useState(
    Array.isArray(initial.filtros) ? initial.filtros : []
  );
  const [files, setFiles] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [alert, setAlert] = useState('');
  const isEdit = !!initial.id;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');
    const kept = (initial.img_urls || []).filter((url) => !removed.includes(url));
    const total = kept.length + files.length;
    if (!isEdit && total < 1) {
      setAlert('Al menos una imagen es obligatoria.');
      return;
    }
    if (isEdit && total < 1) {
      setAlert('Debe quedar al menos una imagen al guardar.');
      return;
    }
    if (total > 5) {
      setAlert('Máximo 5 imágenes por publicación.');
      return;
    }
    const fields = {
      titulo: form.titulo,
      nombre: form.nombre || form.titulo,
      descripcion: form.descripcion,
      info: form.info,
      fecha: form.fecha,
      direccion: form.direccion,
      contacto: form.contacto,
    };
    const fd = buildContentFormData(tipo, fields, files);
    if (cfg.hasFiltros) appendFiltros(fd, filtros);
    if (isEdit && removed.length) {
      fd.append('eliminar_imagenes', JSON.stringify(removed));
    }
    try {
      await onSubmit(fd);
    } catch (err) {
      setAlert(err.message);
    }
  };

  return (
    <form className="form-wrapper" onSubmit={handleSubmit}>
      <div className="form-header">
        <div className="form-header-icon" style={{ background: `${cfg.color}28`, color: cfg.color }}>
          {cfg.icon}
        </div>
        <div>
          <h2 className="form-title">{isEdit ? `Editar ${cfg.title}` : `Agregar ${cfg.title}`}</h2>
        </div>
      </div>
      {alert && <p className="admin-alert">{alert}</p>}

      {(tipo === 'noticia' ? (
        <div className="form-group">
          <label className="form-label">Título <span className="required">*</span></label>
          <input className="form-input" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} required />
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Nombre <span className="required">*</span></label>
          <input className="form-input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
        </div>
      ))}

      <ImageUploader
        existing={initial.img_urls || []}
        removed={removed}
        onExistingRemove={(url) => setRemoved((r) => [...r, url])}
        onFilesChange={setFiles}
        required={!isEdit}
      />

      <div className="form-group">
        <label className="form-label">Descripción breve <span className="required">*</span></label>
        <textarea
          className="form-textarea"
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          maxLength={tipo === 'noticia' ? 200 : undefined}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Contenido completo</label>
        <textarea className="form-textarea" value={form.info} onChange={(e) => set('info', e.target.value)} />
      </div>

      {tipo === 'noticia' && (
        <>
          <div className="form-group">
            <label className="form-label">Fecha <span className="required">*</span></label>
            <input type="date" className="form-input" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Lugar</label>
            <input className="form-input" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </div>
        </>
      )}

      {(tipo === 'servicio' || tipo === 'que_hacer') && (
        <div className="form-group">
          <label className="form-label">Contacto <span className="required">*</span></label>
          <input className="form-input" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} required />
        </div>
      )}

      {tipo === 'que_visitar' && (
        <div className="form-group">
          <label className="form-label">Contacto</label>
          <input className="form-input" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
        </div>
      )}

      {cfg.hasFiltros && <FiltrosCheckboxes tipo={tipo} value={filtros} onChange={setFiltros} />}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
