const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  // Inicialización correcta y nativa para mysql2 en Producción
  const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;
  pool = mysql.createPool(connectionString);
} else {
  // Configuración Clásica para Local (Desarrollo)
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'theluxfoster',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

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
