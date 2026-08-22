export default function FilterBar({ options, value = [], onChange }) {
  const toggle = (opt) => {
    const next = value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt];
    onChange?.(next);
  };

  return (
    <div className="lista-filtros-wrap">
      <span className="lista-filtros-label">Filtrar por:</span>
      <div className="lista-filtros-inner">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`filter-btn${value.includes(opt) ? ' active' : ''}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
