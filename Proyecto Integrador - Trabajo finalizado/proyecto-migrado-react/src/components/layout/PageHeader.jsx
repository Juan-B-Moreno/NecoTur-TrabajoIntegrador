import { Link } from 'react-router-dom';

export default function PageHeader({ breadcrumb, title, subtitle, lineColor = '#8161AF' }) {
  return (
    <div className="page-header">
      <div className="container">
        {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-sub">{subtitle}</div>}
        <div className="page-line" style={{ background: lineColor }} />
      </div>
    </div>
  );
}

export function BreadcrumbLink({ to, children }) {
  return (
    <>
      <Link to={to}>{children}</Link> ›{' '}
    </>
  );
}
