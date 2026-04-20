const pool = require('./config/db');
async function check() {
  try {
    const [prods] = await pool.query('SELECT * FROM productos');
    console.log('Productos:', JSON.stringify(prods, null, 2));
    const [sales] = await pool.query('SELECT * FROM movimientos WHERE tipo = "venta"');
    console.log('Ventas:', JSON.stringify(sales, null, 2));
    const [links] = await pool.query('SELECT * FROM venta_productos');
    console.log('Relaciones:', JSON.stringify(links, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
