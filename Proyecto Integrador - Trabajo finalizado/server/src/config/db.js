/*
  db.js
  ----------------
  Pool de conexiones MySQL para toda la API.
  - Lee host, puerto, usuario, contraseña y base desde variables de entorno.
  - Valores por defecto: localhost:3306, usuario root, base `necotur`.
  - Exporta el pool usado por controllers y utilidades que consultan la BD.
*/

const mysql = require('mysql2/promise');
const path = require('path');

// Carga .env desde server/ (misma carpeta que package.json)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Pool compartido (max. 10 conexiones simultaneas)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'necotur',
  waitForConnections: true, // encola peticiones si no hay conexion libre
  connectionLimit: 10,
});

module.exports = pool;
