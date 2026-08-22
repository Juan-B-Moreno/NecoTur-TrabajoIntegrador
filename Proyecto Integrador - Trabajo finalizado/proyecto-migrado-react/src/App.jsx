import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import HomePage from './pages/public/HomePage';
import HubPage from './pages/public/HubPage';
import ContentListPage from './pages/public/ContentListPage';
import DetailPage from './pages/public/DetailPage';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGestionPage from './pages/admin/AdminGestionPage';
import AdminCreatePage from './pages/admin/AdminCreatePage';
import AdminEditPage from './pages/admin/AdminEditPage';
import UserFormPage from './pages/admin/UserFormPage';
import AdminMovimientosPage from './pages/admin/AdminMovimientosPage';
import AdminFiltrosPage from './pages/admin/AdminFiltrosPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="hub" element={<HubPage />} />
        <Route path="noticias" element={<ContentListPage configKey="noticia" />} />
        <Route path="servicios" element={<ContentListPage configKey="servicio" />} />
        <Route path="que-hacer" element={<ContentListPage configKey="que_hacer" />} />
        <Route path="que-visitar" element={<ContentListPage configKey="que_visitar" />} />
        <Route path="detalle/:tipo/:id" element={<DetailPage />} />
      </Route>

      <Route path="login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/crear" element={<AdminCreatePage />} />
        <Route path="admin/gestion/:seccion" element={<AdminGestionPage />} />
        <Route path="admin/editar/:tipo/:id" element={<AdminEditPage />} />
        <Route path="admin/usuarios/crear" element={<UserFormPage />} />
        <Route path="admin/usuarios/editar/:id" element={<UserFormPage />} />
        <Route path="admin/movimientos" element={<AdminMovimientosPage />} />
        <Route path="admin/filtros" element={<AdminFiltrosPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="usuario/crear" element={<AdminCreatePage soloNoticia />} />
        <Route path="usuario/mis-noticias" element={<AdminGestionPage misNoticias />} />
        <Route path="usuario/editar/noticia/:id" element={<AdminEditPage userMode />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
