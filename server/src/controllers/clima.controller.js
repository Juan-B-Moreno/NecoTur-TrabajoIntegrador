const CLIMA_URL = process.env.CLIMA_DATA_URL || 'https://puertoquequen.com/data.txt';
const CACHE_MS = 15 * 60 * 1000;

let cache = { data: null, fetchedAt: 0 };

const WIND_LABELS = {
  N: 'Norte',
  NE: 'Noreste',
  E: 'Este',
  SE: 'Sureste',
  S: 'Sur',
  SW: 'Suroeste',
  W: 'Oeste',
  NW: 'Noroeste',
};

function parseClimaRaw(text) {
  const result = {};
  String(text)
    .split(/[\r\n&]+/)
    .forEach((part) => {
      const trimmed = part.trim();
      if (!trimmed) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    });
  return result;
}

function formatClima(raw) {
  const temp = raw.Temperatura != null ? Number(raw.Temperatura) : null;
  const feels = raw.SensacionTermica != null ? Number(raw.SensacionTermica) : null;
  const humidity = raw.Humedad != null ? Number(raw.Humedad) : null;
  const windSpeed = raw.VelocidadViento != null ? Number(raw.VelocidadViento) : null;
  const windDir = WIND_LABELS[raw.DireccionViento] || raw.DireccionViento || '';
  const pressure = raw.Presion != null ? Number(raw.Presion) : null;
  const rainDay = raw.LluviaDia != null ? Number(raw.LluviaDia) : null;
  const rainMonth = raw.LluviaMes != null ? Number(raw.LluviaMes) : null;
  const rainYear = raw.LluviaAnual != null ? Number(raw.LluviaAnual) : null;

  let desc = 'Datos en tiempo real';
  if (humidity != null && humidity >= 80) desc = 'Alta humedad';
  else if (temp != null && temp >= 28) desc = 'Caluroso';
  else if (temp != null && temp <= 10) desc = 'Frío';
  else if (windSpeed != null && windSpeed >= 25) desc = 'Ventoso';
  else if (rainDay != null && rainDay > 0) desc = 'Lluvia registrada hoy';

  return {
    dia: raw.Dia || null,
    hora: raw.Hora || null,
    temperatura: temp,
    sensacion: feels,
    humedad: humidity,
    presion: pressure,
    lluviaDia: rainDay,
    lluviaMes: rainMonth,
    lluviaAnual: rainYear,
    vientoKmh: windSpeed,
    vientoDireccion: windDir,
    descripcion: desc,
    fuente: 'Puerto Quequén',
  };
}

async function fetchClimaFromSource() {
  const res = await fetch(CLIMA_URL, {
    headers: { Accept: 'text/plain,*/*' },
  });
  if (!res.ok) {
    throw new Error(`Clima HTTP ${res.status}`);
  }
  const text = await res.text();
  return formatClima(parseClimaRaw(text));
}

async function refreshClimaCache() {
  const data = await fetchClimaFromSource();
  cache = { data, fetchedAt: Date.now() };
  return cache;
}

async function getClimaCached() {
  const now = Date.now();
  if (!cache.data || now - cache.fetchedAt >= CACHE_MS) {
    await refreshClimaCache();
  }
  return cache;
}

async function getClima(req, res) {
  try {
    const { data, fetchedAt } = await getClimaCached();
    res.json({
      ok: true,
      clima: data,
      actualizado: new Date(fetchedAt).toISOString(),
    });
  } catch (err) {
    console.error('getClima:', err.message);
    if (cache.data) {
      return res.json({
        ok: true,
        clima: cache.data,
        actualizado: new Date(cache.fetchedAt).toISOString(),
        stale: true,
      });
    }
    res.status(502).json({ ok: false, message: 'No se pudo obtener el clima' });
  }
}

function startClimaRefreshJob() {
  refreshClimaCache().catch((err) => {
    console.error('Clima inicial:', err.message);
  });
  setInterval(() => {
    refreshClimaCache().catch((err) => {
      console.error('Clima refresh:', err.message);
    });
  }, CACHE_MS);
}

module.exports = { getClima, startClimaRefreshJob, refreshClimaCache };
