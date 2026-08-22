export const MAX_IMAGENES = 5;

export function itemImages(item) {
  if (!item) return [];
  if (item.img_urls?.length) return item.img_urls;
  if (item.img_url) return [item.img_url];
  return [];
}

export function primaryImage(item) {
  const list = itemImages(item);
  return list[0] || null;
}

export function parseImageList(item) {
  if (!item) return [];
  if (item.img_urls?.length) return [...item.img_urls];
  const raw = item.img_url || item.url_imagen;
  if (!raw) return [];
  if (typeof raw === 'string' && raw.trim().charAt(0) === '[') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed.filter(Boolean);
    } catch {
      /* formato antiguo */
    }
  }
  if (typeof raw === 'string') return [raw];
  return [];
}
