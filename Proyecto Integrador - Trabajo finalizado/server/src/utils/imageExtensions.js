const path = require('path');

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function isAllowedImageExtension(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.includes(ext);
}

module.exports = {
  ALLOWED_IMAGE_EXTENSIONS,
  isAllowedImageExtension,
};
