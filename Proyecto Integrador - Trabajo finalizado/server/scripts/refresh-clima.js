require('dotenv').config();

const { refreshClimaCache } = require('../src/controllers/clima.controller');

refreshClimaCache()
  .then(() => {
    console.log('Clima actualizado correctamente');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error al actualizar clima:', err.message);
    process.exit(1);
  });
