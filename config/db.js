const mysql = require('mysql2/promise');
require('dotenv').config();

let dbConfig = {};

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  // Configuración limpia y nativa para Producción (Railway usa MYSQL_URL)
  dbConfig = {
    uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
} else {
  // Configuración Clásica para Local (Desarrollo)
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tlf',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const pool = mysql.createPool(dbConfig);

// Probar conexión
pool.getConnection()
  .then(connection => {
    console.log('✅ Base de datos conectada correctamente');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error enviando a la base de datos:', err.message);
  });

module.exports = pool;
