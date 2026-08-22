import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { titleForPath } from '../../constants/pageTitles';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = titleForPath(pathname);
    if (title) document.title = title;
  }, [pathname]);

  return (
    <>
      <AdminNavbar />
      <Outlet />
    </>
  );
}
