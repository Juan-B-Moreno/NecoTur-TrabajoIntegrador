const LOGIN_FORBIDDEN = /[|/{}´()`_\-]/;

function hasAccentsOrEnye(value) {
  if (/ñ/i.test(value)) return true;
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '') !== value;
}

export function validateLoginField(value, label = 'Este campo') {
  if (!value) return `${label} es obligatorio.`;
  if (LOGIN_FORBIDDEN.test(value)) {
    return `${label} no puede contener los caracteres | / { } ´ ( ) - _`;
  }
  if (hasAccentsOrEnye(value)) {
    return `${label} no puede contener acentos ni la letra ñ.`;
  }
  return null;
}

export function filterLoginInput(value) {
  return String(value)
    .split('')
    .filter((ch) => {
      if (LOGIN_FORBIDDEN.test(ch)) return false;
      if (/ñ/i.test(ch)) return false;
      return ch === ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    })
    .join('');
}
