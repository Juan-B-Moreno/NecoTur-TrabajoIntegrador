function appendField(fd, key, value) {
  if (value != null && value !== '') fd.append(key, value);
}

export function appendFiltros(fd, filtros) {
  fd.append('filtros', JSON.stringify(filtros || []));
}

export function buildContentFormData(tipo, fields, files, extra = {}) {
  const fd = new FormData();

  if (tipo === 'noticia') {
    const titulo = fields.titulo || fields.nombre || '';
    appendField(fd, 'titulo', titulo);
    appendField(fd, 'nombre', titulo);
    appendField(fd, 'descripcion', fields.descripcion);
    appendField(fd, 'contenido', fields.info);
    appendField(fd, 'info', fields.info);
    appendField(fd, 'fecha', fields.fecha);
    appendField(fd, 'lugar', fields.direccion);
    appendField(fd, 'direccion', fields.direccion);
  } else if (tipo === 'que_visitar') {
    appendField(fd, 'nombre', fields.nombre);
    appendField(fd, 'descripcion', fields.descripcion);
    appendField(fd, 'informacion', fields.info);
    appendField(fd, 'info', fields.info);
    appendField(fd, 'contacto', fields.contacto);
  } else {
    appendField(fd, 'nombre', fields.nombre);
    appendField(fd, 'descripcion', fields.descripcion);
    appendField(fd, 'info', fields.info);
    appendField(fd, 'contacto', fields.contacto);
  }

  (files || []).forEach((file) => fd.append('imagenes', file));
  Object.entries(extra).forEach(([key, value]) => fd.append(key, value));
  return fd;
}
