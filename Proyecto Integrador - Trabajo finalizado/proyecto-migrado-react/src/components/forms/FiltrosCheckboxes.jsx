import { useFiltrosOptions } from '../../hooks/useFiltrosOptions';

export default function FiltrosCheckboxes({ tipo, value = [], onChange }) {
  const { options, loading } = useFiltrosOptions(tipo);

  if (loading) {
    return <p className="form-hint">Cargando filtros…</p>;
  }
  if (!options.length) return null;

  const toggle = (opt) => {
    const next = value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt];
    onChange(next);
  };

  return (
    <div className="form-group">
      <span className="form-label">Filtros (opcional)</span>
      <div className="filtros-checkboxes">
        {options.map((opt) => (
          <label key={opt} className="filtro-check-label">
            <input
              type="checkbox"
              checked={value.includes(opt)}
              onChange={() => toggle(opt)}
            />{' '}
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
