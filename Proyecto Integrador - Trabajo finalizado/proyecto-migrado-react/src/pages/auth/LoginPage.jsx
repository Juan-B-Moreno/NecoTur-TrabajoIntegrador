import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { filterLoginInput, validateLoginField } from '../../utils/loginValidation';

function redirectAfterLogin(user, from) {
  if (from && from !== '/login') return from;
  return user.rol === 'admin' ? '/admin' : '/usuario/crear';
}

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle('Iniciar sesión — necochea.tur.ar');

  useEffect(() => {
    if (authLoading || !user) return;
    navigate(redirectAfterLogin(user, location.state?.from?.pathname), { replace: true });
  }, [user, authLoading, navigate, location.state]);

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading || user) {
    return (
      <div className="container" style={{ padding: '120px 20px', textAlign: 'center' }}>
        Cargando sesión…
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const usuarioErr = validateLoginField(usuario, 'El usuario');
    const passwordErr = validateLoginField(password, 'La contraseña');
    if (usuarioErr || passwordErr) {
      setError(usuarioErr || passwordErr);
      return;
    }

    setLoading(true);
    try {
      const data = await login(usuario, password);
      navigate(redirectAfterLogin(data.user, location.state?.from?.pathname), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-logo">
            <Link to="/">
              <img src="/img/logo.png" alt="Logo Necochea Turismo" />
            </Link>
          </div>
          <div className="nav-links">
            <div className="nav-item">
              <Link className="nav-link active" to="/">
                Volver a Inicio
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container" style={{ padding: '80px 20px 40px' }}>
        <div className="form-wrapper" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="form-header">
            <div className="form-header-icon" style={{ background: 'rgba(129, 97, 175, .12)', color: '#8161AF' }}>
              <img src="/img/iconos/usuario.png" alt="Icono de usuario" width="60" height="60" />
            </div>
            <div>
              <h2 className="form-title">Iniciar sesión</h2>
              <p className="form-desc">Accede con tu nombre de usuario y contraseña para continuar.</p>
            </div>
          </div>

          {error && (
            <div className="form-helper" style={{ color: '#EA5A51', fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="usuario">
                Nombre de usuario
              </label>
              <input
                id="usuario"
                type="text"
                className="form-input"
                value={usuario}
                onChange={(e) => setUsuario(filterLoginInput(e.target.value))}
                required
                autoComplete="username"
              />
              <small className="form-helper">
                Sin acentos, ñ ni caracteres | / {'{ }'} ´ ( ) - _
              </small>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>
              <div className="password-field-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(filterLoginInput(e.target.value))}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>
              <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Volver a Inicio
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
