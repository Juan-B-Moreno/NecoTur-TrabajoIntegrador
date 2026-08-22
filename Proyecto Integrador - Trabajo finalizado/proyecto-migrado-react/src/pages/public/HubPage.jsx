import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/siteConfig';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';

export default function HubPage() {
  const driveUrl = siteConfig.hubGoogleDriveUrl || '/hub';

  return (
    <div className="inner-page page-hub">
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            <span>Hub</span>
          </>
        }
        title="Hub de contenidos"
        subtitle="Material oficial de la Secretaría de Turismo para medios y difusión"
        lineColor="#8161AF"
      />
      <section className="section">
        <div className="container">
          <p style={{ marginBottom: 24 }}>
            Accedé a fotos en alta calidad, logos y recursos oficiales para campañas y prensa.
          </p>
          <a href={driveUrl} className="btn btn-primary" target="_blank" rel="noreferrer">
            Abrir carpeta de Google Drive
          </a>
          <div style={{ marginTop: 24 }}>
            <Link to="/" className="btn btn-secondary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
