/*
  auditLog.js — registro de movimientos (editar / eliminar / crear).
*/

const pool = require('../config/db');

async function ensureMovimientosTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NULL,
      usuario_login VARCHAR(80) NOT NULL,
      usuario_nombre VARCHAR(120) NOT NULL,
      accion ENUM('crear', 'editar', 'eliminar') NOT NULL,
      entidad VARCHAR(50) NOT NULL,
      entidad_id INT NULL,
      entidad_titulo VARCHAR(255) NULL,
      detalle VARCHAR(500) NULL,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_movimientos_fecha (creado_en DESC),
      INDEX idx_movimientos_entidad (entidad, entidad_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

function actorFromSession(req) {
  return {
    id_usuario: req.session?.userId ?? null,
    usuario_login: req.session?.usuario || 'sistema',
    usuario_nombre: req.session?.nombre || req.session?.usuario || 'Sistema',
  };
}

async function logMovimiento(req, { accion, entidad, entidad_id, entidad_titulo, detalle }) {
  try {
    const actor = actorFromSession(req);
    await pool.execute(
      `INSERT INTO movimientos
        (id_usuario, usuario_login, usuario_nombre, accion, entidad, entidad_id, entidad_titulo, detalle)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actor.id_usuario,
        actor.usuario_login,
        actor.usuario_nombre,
        accion,
        entidad,
        entidad_id ?? null,
        entidad_titulo ?? null,
        detalle ?? null,
      ]
    );
  } catch (err) {
    console.error('logMovimiento:', err.message);
  }
}

module.exports = { ensureMovimientosTable, logMovimiento };
