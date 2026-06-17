(function () {
  const REFRESH_MS = 15 * 60 * 1000;

  function el(id) {
    return document.getElementById(id);
  }

  function formatUpdated(iso) {
    if (!iso) return 'Actualizado recientemente';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Actualizado recientemente';
    return `Actualizado ${d.toLocaleString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  function render(clima, actualizado, stale) {
    const tempEl = el('clima-temp');
    const descEl = el('clima-desc');
    const updatedEl = el('clima-updated');
    const extrasEl = el('clima-extras');

    if (!clima || !tempEl || !extrasEl) return;

    tempEl.textContent =
      clima.temperatura != null ? `${Math.round(clima.temperatura * 10) / 10}°C` : '—';
    if (descEl) descEl.textContent = clima.descripcion || 'Clima en Necochea';

    if (updatedEl) {
      updatedEl.textContent = formatUpdated(actualizado) + (stale ? ' (últimos datos disponibles)' : '');
    }

    const extras = [];
    if (clima.humedad != null) extras.push(`💧 Humedad: ${clima.humedad}%`);
    if (clima.vientoKmh != null) {
      const dir = clima.vientoDireccion ? ` ${clima.vientoDireccion}` : '';
      extras.push(`🌬 Viento: ${clima.vientoKmh} km/h${dir}`);
    }
    if (clima.sensacion != null) extras.push(`☀️ Sensación: ${clima.sensacion}°C`);
    if (clima.presion != null) extras.push(`📊 Presión: ${clima.presion} hPa`);
    if (clima.lluviaDia != null) extras.push(`🌧 Lluvia hoy: ${clima.lluviaDia} mm`);
    if (clima.lluviaMes != null) extras.push(`📅 Lluvia mes: ${clima.lluviaMes} mm`);

    extrasEl.innerHTML = extras.map((t) => `<div class="clima-extra">${t}</div>`).join('');
  }

  async function loadClima() {
    try {
      const res = await fetch('/api/public/clima');
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Error');
      render(data.clima, data.actualizado, data.stale);
    } catch (err) {
      console.error('Clima:', err);
      const updatedEl = el('clima-updated');
      if (updatedEl) updatedEl.textContent = 'No se pudo cargar el clima';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadClima();
    setInterval(loadClima, REFRESH_MS);
  });
})();
