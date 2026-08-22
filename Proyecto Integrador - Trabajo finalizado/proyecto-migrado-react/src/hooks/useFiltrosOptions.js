import { useEffect, useState } from 'react';
import { fetchFiltrosCatalogo } from '../api/publicApi';

export function useFiltrosOptions(tipo) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFiltrosCatalogo(tipo)
      .then((list) => {
        if (!cancelled) setOptions(list);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tipo]);

  return { options, loading };
}
