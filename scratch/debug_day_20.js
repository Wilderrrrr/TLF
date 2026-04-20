const pool = require('../config/db');

async function debug() {
  try {
    const [rows] = await pool.query('SELECT id, tipo, monto, fecha, cliente_id FROM movimientos WHERE fecha LIKE "2026-04-20%"');
    console.log('--- MOVEMENTS FOR DAY 20 ---');
    console.table(rows);
    
    rows.forEach(m => {
        console.log(`ID: ${m.id}, Tipo: ${m.tipo}, ClienteID: ${m.cliente_id}, typeof ClienteID: ${typeof m.cliente_id}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
