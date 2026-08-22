import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ContentCard from '../../components/cards/ContentCard';
import FilterBar from '../../components/filters/FilterBar';
import PageHeader, { BreadcrumbLink } from '../../components/layout/PageHeader';
import ListPagination from '../../components/pagination/ListPagination';
import { LIST_CONFIG } from '../../constants/contentTypes';
import { usePublicPagination } from '../../hooks/usePublicPagination';
import { useFiltrosOptions } from '../../hooks/useFiltrosOptions';

export default function ContentListPage({ configKey }) {
  const config = LIST_CONFIG[configKey];
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState([]);
  const filtrosKey = filtros.join(',');
  const filtrosMounted = useRef(false);

  const rawPage = Number(searchParams.get('page')) || 1;
  const page = rawPage > 0 ? rawPage : 1;

  const { items, totalPages, loading, error } = usePublicPagination(config.tipo, page, 12, filtros);
  const { options: filtrosOptions } = useFiltrosOptions(config.tipo);

  const updateSearch = useCallback(
    (mutate, replace = false) => {
      const params = new URLSearchParams(location.search);
      const next = mutate(params);
      const qs = next.toString();
      navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace });
    },
    [location.pathname, location.search, navigate],
  );

  const filtroParam = searchParams.get('filtro') || searchParams.get('filtros');

  useEffect(() => {
    if (!filtroParam) {
      setFiltros([]);
      return;
    }
    const requested = filtroParam
      .split(',')
      .map((s) => decodeURIComponent(s.trim()))
      .filter(Boolean);
    if (!filtrosOptions.length) {
      setFiltros(requested);
      return;
    }
    const matched = requested
      .map(
        (r) => filtrosOptions.find((o) => o.toLowerCase() === r.toLowerCase()) || null,
      )
      .filter(Boolean);
    setFiltros(matched);
  }, [filtroParam, filtrosOptions]);

  const handleFiltrosChange = useCallback(
    (next) => {
      setFiltros(next);
      updateSearch((params) => {
        params.delete('page');
        if (next.length === 0) {
          params.delete('filtro');
          params.delete('filtros');
        } else {
          params.set('filtro', next.join(','));
          params.delete('filtros');
        }
        return params;
      }, true);
    },
    [updateSearch],
  );

  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);
  navigateRef.current = navigate;
  locationRef.current = location;

  useEffect(() => {
    if (!filtrosMounted.current) {
      filtrosMounted.current = true;
      return;
    }
    const { pathname, search } = locationRef.current;
    const params = new URLSearchParams(search);
    params.delete('page');
    const qs = params.toString();
    navigateRef.current(`${pathname}${qs ? `?${qs}` : ''}`, { replace: true });
  }, [filtrosKey]);

  useEffect(() => {
    if (loading || totalPages <= 0 || page <= totalPages) return;
    updateSearch((params) => {
      if (totalPages <= 1) params.delete('page');
      else params.set('page', String(totalPages));
      return params;
    }, true);
  }, [page, totalPages, loading, updateSearch]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, filtrosKey]);

  const handlePageChange = useCallback(
    (nextPage) => {
      if (nextPage < 1 || nextPage === page) return;
      updateSearch((params) => {
        if (nextPage <= 1) params.delete('page');
        else params.set('page', String(nextPage));
        return params;
      });
    },
    [page, updateSearch],
  );

  return (
    <div className={`inner-page page-${configKey}`}>
      <PageHeader
        breadcrumb={
          <>
            <BreadcrumbLink to="/">Inicio</BreadcrumbLink>
            <span>{config.title}</span>
          </>
        }
        title={config.title}
        subtitle={config.subtitle}
        lineColor={config.lineColor}
      />
      <section className="section">
        <div className="container">
          {config.hasFiltros && filtrosOptions.length > 0 && (
            <FilterBar options={filtrosOptions} value={filtros} onChange={handleFiltrosChange} />
          )}
          <div className={config.gridClass} id="cards-grid">
            {loading && items.length === 0 && <p className="lista-empty">Cargando…</p>}
            {error && <p className="lista-empty">{error}</p>}
            {!loading && !error && items.length === 0 && (
              <p className="lista-empty">No hay resultados con esos filtros.</p>
            )}
            {items.map((item) => (
              <ContentCard key={item.id} item={item} tipo={config.tipo} />
            ))}
          </div>
          <ListPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </section>
    </div>
  );
}
