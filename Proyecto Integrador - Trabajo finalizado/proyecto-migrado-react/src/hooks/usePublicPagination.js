import { useEffect, useState } from 'react';
import { fetchList } from '../api/publicApi';

export function usePublicPagination(tipo, page, pageSize, filtros = []) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtrosKey = filtros.join(',');

  useEffect(() => {
    let cancelled = false;
    const offset = (page - 1) * pageSize;

    setLoading(true);
    setError(null);

    fetchList(tipo, pageSize, offset, filtros)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total ?? result.items.length);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tipo, page, pageSize, filtrosKey, filtros]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, total, totalPages, loading, error };
}
