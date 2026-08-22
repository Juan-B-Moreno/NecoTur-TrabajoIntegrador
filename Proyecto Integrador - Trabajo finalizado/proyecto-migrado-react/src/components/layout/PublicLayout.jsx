import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DEFAULT_DOCUMENT_TITLE, titleForPath } from '../../constants/pageTitles';
import Footer from './Footer';
import Navbar from './Navbar';
import WhatsAppFloat from './WhatsAppFloat';

export default function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = titleForPath(pathname);
    if (title) document.title = title;
    else if (!pathname.startsWith('/detalle/')) {
      document.title = DEFAULT_DOCUMENT_TITLE;
    }
  }, [pathname]);

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
