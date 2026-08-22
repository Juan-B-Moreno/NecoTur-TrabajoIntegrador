const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp'];

export function isAllowedImageFile(file) {
  if (!file?.name) return false;
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  return ALLOWED.includes(ext);
}

export const ALLOWED_IMAGE_LABEL = 'JPG, JPEG, PNG o WebP';
