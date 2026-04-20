const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [rows] = await c.query('SELECT * FROM usuarios WHERE usuario="admin"');
  console.log("DB User:", rows[0]);
  
  const newHash = bcrypt.hashSync('admin123', 10);
  await c.query('UPDATE usuarios SET password=? WHERE usuario="admin"', [newHash]);
  console.log("Password successfully updated to hash:", newHash);
  
  const [rows2] = await c.query('SELECT * FROM usuarios WHERE usuario="admin"');
  console.log("DB User now updated:", rows2[0] !== undefined);
  
  await c.end();
}
run().catch(console.error);
