const pool = require('../../config/db');

/**
 * Finance Data Access Layer
 */

exports.findAll = async () => {
  const query = `
    SELECT m.*, c.nombre as cliente_nombre 
    FROM movimientos m 
    LEFT JOIN clientes c ON m.cliente_id = c.id 
    ORDER BY m.fecha DESC, m.created_at DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

exports.create = async ({ tipo, monto, descripcion, fecha, cliente_id, metodo_pago }) => {
  const [result] = await pool.query(
    'INSERT INTO movimientos (tipo, monto, descripcion, fecha, cliente_id, metodo_pago) VALUES (?, ?, ?, ?, ?, ?)',
    [tipo, monto, descripcion, fecha, cliente_id, metodo_pago]
  );

  return { id: result.insertId, tipo, monto, descripcion, fecha, cliente_id, metodo_pago };
};

exports.getDailySummary = async () => {
  const query = `
    SELECT 
      fecha,
      SUM(CASE WHEN (tipo = 'venta' AND cliente_id IS NULL) OR tipo = 'abono' THEN monto ELSE 0 END) as total_ventas,
      SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos,
      (SUM(CASE WHEN (tipo = 'venta' AND cliente_id IS NULL) OR tipo = 'abono' THEN monto ELSE 0 END) - SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END)) as balance
    FROM movimientos
    GROUP BY fecha
    ORDER BY fecha DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

exports.update = async (id, { tipo, monto, descripcion, fecha, metodo_pago }) => {
  await pool.query(
    'UPDATE movimientos SET tipo = ?, monto = ?, descripcion = ?, fecha = ?, metodo_pago = ? WHERE id = ?',
    [tipo, monto, descripcion, fecha, metodo_pago, id]
  );
  return { id, tipo, monto, descripcion, fecha, metodo_pago };
};

exports.remove = async (id) => {
  await pool.query('DELETE FROM movimientos WHERE id = ?', [id]);
  return true;
};

exports.getPeriodicStats = async () => {
  const query = `
    SELECT 
      -- Mes Actual
      SUM(CASE WHEN ((tipo = 'venta' AND cliente_id IS NULL) OR tipo = 'abono') AND MONTH(fecha) = MONTH(CURRENT_DATE) AND YEAR(fecha) = YEAR(CURRENT_DATE) THEN monto ELSE 0 END) as mes_ventas,
      SUM(CASE WHEN tipo = 'gasto' AND MONTH(fecha) = MONTH(CURRENT_DATE) AND YEAR(fecha) = YEAR(CURRENT_DATE) THEN monto ELSE 0 END) as mes_gastos,
      
      -- Mes Anterior
      SUM(CASE WHEN ((tipo = 'venta' AND cliente_id IS NULL) OR tipo = 'abono') AND MONTH(fecha) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) AND YEAR(fecha) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) THEN monto ELSE 0 END) as mes_ventas_anterior,
      SUM(CASE WHEN tipo = 'gasto' AND MONTH(fecha) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) AND YEAR(fecha) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) THEN monto ELSE 0 END) as mes_gastos_anterior,

      -- Semana Actual (Últimos 7 días)
      SUM(CASE WHEN ((tipo = 'venta' AND cliente_id IS NULL) OR tipo = 'abono') AND fecha >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) THEN monto ELSE 0 END) as semana_ventas,
      SUM(CASE WHEN tipo = 'gasto' AND fecha >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) THEN monto ELSE 0 END) as semana_gastos,

      -- Semana Anterior (7 a 14 días atrás)
      SUM(CASE WHEN ((tipo = 'venta' AND cliente_id IS NULL) OR tipo = 'abono') AND fecha >= DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY) AND fecha < DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) THEN monto ELSE 0 END) as semana_ventas_anterior,
      SUM(CASE WHEN tipo = 'gasto' AND fecha >= DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY) AND fecha < DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) THEN monto ELSE 0 END) as semana_gastos_anterior
    FROM movimientos;
  `;
  const [rows] = await pool.query(query);
  return rows[0];
};

exports.getAnalyticsData = async (days = 30) => {
  const query = `
    SELECT 
      fecha,
      SUM(CASE WHEN (tipo = 'venta' AND cliente_id IS NULL) OR tipo = 'abono' THEN monto ELSE 0 END) as ingresos,
      SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as egresos
    FROM movimientos
    WHERE fecha >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
    GROUP BY fecha
    ORDER BY fecha ASC
  `;
  const [rows] = await pool.query(query, [days]);
  return rows;
};

exports.getProductsDistribution = async (limit = 5) => {
    const query = `
        SELECT 
            p.nombre,
            SUM(vp.cantidad * vp.precio_unitario) as total_generado
        FROM venta_productos vp
        JOIN productos p ON vp.producto_id = p.id
        GROUP BY p.id, p.nombre
        ORDER BY total_generado DESC
        LIMIT ?
    `;
    const [rows] = await pool.query(query, [limit]);
    return rows;
};

exports.findProductsByMovementIds = async (ids) => {
    if (!ids || ids.length === 0) return [];
    const query = `
        SELECT vp.*, p.nombre 
        FROM venta_productos vp 
        JOIN productos p ON vp.producto_id = p.id 
        WHERE vp.movimiento_id IN (?)
    `;
    const [rows] = await pool.query(query, [ids]);
    return rows;
};

