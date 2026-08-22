import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createUsuario, fetchUsuario, updateUsuario } from '../../api/adminApi';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';

const EMPTY_FORM = {
  nombre: '',
  usuario: '',
  dni: '',
  email: '',
  contrasena: '',
  contrasenaConfirmar: '',
  rol: 'usuario',
};

function sanitizeDni(value) {
  return value.replace(/[^\d.]/g, '');
}

function isValidDni(value) {
  if (!value) return true;
  return /^[\d.]+$/.test(value);
}

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    fetchUsuario(id)
      .then((u) =>
        setForm({
          nombre: u.nombre || '',
          usuario: u.usuario || '',
          dni: u.dni || '',
          email: u.email || '',
          contrasena: '',
          contrasenaConfirmar: '',
          rol: u.rol || 'usuario',
        })
      )
      .catch((err) => setError(err.message));
  }, [id, isEdit]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidDni(form.dni)) {
      setError('El DNI solo puede contener números y puntos.');
      return;
    }
    if (!isEdit && form.contrasena !== form.contrasenaConfirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (isEdit && form.contrasena && form.contrasena !== form.contrasenaConfirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      const payload = {
        nombre: form.nombre,
        usuario: form.usuario,
        dni: form.dni,
        email: form.email,
        rol: form.rol,
      };
      if (form.contrasena) payload.contrasena = form.contrasena;
      if (isEdit) await updateUsuario(id, payload);
      else await createUsuario({ ...payload, contrasena: form.contrasena });
      navigate(
        isEdit ? '/admin/gestion/usuarios?actualizado=1' : '/admin/gestion/usuarios?creado=1'
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="inner-page page-formulario page-admin-panel">
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            <BreadcrumbLink to="/admin">Panel admin</BreadcrumbLink>
            <span>{isEdit ? 'Editar usuario' : 'Crear usuario'}</span>
          </>
        }
        title={isEdit ? 'Editar usuario' : 'Crear usuario'}
        subtitle={
          isEdit
            ? 'Modificá los datos del usuario seleccionado.'
            : 'Complete los datos del nuevo usuario que será creado por el administrador.'
        }
      />
      <section className="section">
        <div className="container">
          <form className="form-wrapper" onSubmit={handleSubmit} noValidate>
            {error && <p className="admin-alert">{error}</p>}
            <div className="form-header">
              <div className="form-header-icon" style={{ background: '#8CD4EF28', color: '#1a6080' }}>
                👤
              </div>
              <div>
                <h2 className="form-title">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                <p className="form-desc">
                  Los campos con * son obligatorios. El rol indica el nivel de acceso.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre completo <span className="required">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                className="form-input"
                placeholder="Nombre y apellido"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="usuario">
                Nombre de usuario <span className="required">*</span>
              </label>
              <input
                id="usuario"
                name="usuario"
                className="form-input"
                placeholder="Ej: jperez"
                autoComplete="username"
                value={form.usuario}
                onChange={(e) => set('usuario', e.target.value)}
                required
              />
              <small className="form-helper">Se usa para iniciar sesión</small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dni">DNI</label>
              <input
                id="dni"
                name="dni"
                className="form-input"
                placeholder="Documento (opcional)"
                inputMode="numeric"
                pattern="[\d.]*"
                title="Solo números y puntos"
                value={form.dni}
                onChange={(e) => set('dni', sanitizeDni(e.target.value))}
              />
              <small className="form-helper">Solo números y puntos (ej: 12.345.678)</small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="usuario@ejemplo.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contrasena">
                Contraseña {!isEdit && <span className="required">*</span>}
                {isEdit && ' (opcional)'}
              </label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                className="form-input"
                placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Crear contraseña'}
                value={form.contrasena}
                onChange={(e) => set('contrasena', e.target.value)}
                required={!isEdit}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contrasenaConfirmar">
                Confirmar contraseña {!isEdit && <span className="required">*</span>}
                {isEdit && ' (opcional)'}
              </label>
              <input
                id="contrasenaConfirmar"
                name="contrasenaConfirmar"
                type="password"
                className="form-input"
                placeholder={isEdit ? 'Repetir solo si cambiás la contraseña' : 'Repetir contraseña'}
                value={form.contrasenaConfirmar}
                onChange={(e) => set('contrasenaConfirmar', e.target.value)}
                required={!isEdit}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rol">Rol</label>
              <select
                id="rol"
                name="rol"
                className="form-input"
                value={form.rol}
                onChange={(e) => set('rol', e.target.value)}
              >
                <option value="usuario">usuario</option>
                <option value="admin">admin</option>
              </select>
              <small className="form-helper">
                El rol define permisos; solo el administrador puede asignar roles de administrador.
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {isEdit ? 'Guardar cambios' : 'Crear usuario'}
              </button>
              <Link to={isEdit ? '/admin/gestion/usuarios' : '/admin'} className="btn btn-secondary">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
