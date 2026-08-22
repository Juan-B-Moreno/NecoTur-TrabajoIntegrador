import { useEffect, useState } from 'react';
import { fetchClima } from '../api/publicApi';

const REFRESH_MS = 15 * 60 * 1000;

export function useClima() {
  const [clima, setClima] = useState(null);
  const [actualizado, setActualizado] = useState(null);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const data = await fetchClima();
      setClima(data.clima);
      setActualizado(data.actualizado);
      setStale(!!data.stale);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return { clima, actualizado, stale, error };
}
