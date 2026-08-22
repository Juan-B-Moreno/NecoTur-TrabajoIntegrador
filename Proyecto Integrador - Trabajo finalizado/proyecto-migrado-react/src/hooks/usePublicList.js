import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchList } from '../api/publicApi';

export function usePublicList(tipo, pageSize = 12, filtros = []) {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const offsetRef = useRef(0);
  const filtrosKey = filtros.join(',');

  const load = useCallback(
    async (append) => {
      setLoading(true);
      setError(null);
      const startOffset = append ? offsetRef.current : 0;
      try {
        const result = await fetchList(tipo, pageSize, startOffset, filtros);
        setItems((prev) => (append ? [...prev, ...result.items] : result.items));
        offsetRef.current = startOffset + result.items.length;
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err.message);
        if (!append) setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [tipo, pageSize, filtrosKey, filtros]
  );

  useEffect(() => {
    offsetRef.current = 0;
    load(false);
  }, [tipo, pageSize, filtrosKey, load]);

  const loadMore = () => {
    if (!loading && hasMore) load(true);
  };

  return { items, loading, error, hasMore, loadMore, reload: () => load(false) };
}
