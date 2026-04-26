const model = require('./finance.model');
const pool = require('../../config/db');
const productsService = require('../products/products.service');

/**
 * Finance Business Logic Layer
 */

exports.create = async (data) => {
  const { productos, ...movementData } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Crear el movimiento (Ahora incluye cliente_id y metodo_pago)
    const [result] = await connection.query(
      'INSERT INTO movimientos (tipo, monto, descripcion, fecha, cliente_id, metodo_pago) VALUES (?, ?, ?, ?, ?, ?)',
      [movementData.tipo, movementData.monto, movementData.descripcion, movementData.fecha, movementData.cliente_id, movementData.metodo_pago]
    );
    const movimientoId = result.insertId;

    // 2. Lógica de Deuda de Clientes
    if (movementData.cliente_id) {
      if (movementData.tipo === 'venta') {
        // Venta a crédito: Aumentar deuda
        await connection.query(
          'UPDATE clientes SET deuda = deuda + ? WHERE id = ?',
          [movementData.monto, movementData.cliente_id]
        );
      } else if (movementData.tipo === 'abono') {
        // Abono: Validar que no supere la deuda actual
        const [clientRows] = await connection.query('SELECT deuda FROM clientes WHERE id = ?', [movementData.cliente_id]);
        const currentDebt = clientRows[0]?.deuda || 0;

        if (movementData.monto > currentDebt) {
          throw new Error(`El abono ($${movementData.monto}) supera la deuda actual ($${currentDebt}). Por favor ajusta el monto.`);
        }

        // Disminuir deuda
        await connection.query(
          'UPDATE clientes SET deuda = deuda - ? WHERE id = ?',
          [movementData.monto, movementData.cliente_id]
        );
      }
    }

    // 3. Asociar productos y descontar stock (Solo si vienen productos)
    if (productos && productos.length) {
      for (const item of productos) {
        await connection.query(
          'INSERT INTO venta_productos (movimiento_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [movimientoId, item.id, item.cantidad, item.precio]
        );

        if (movementData.tipo === 'venta') {
          await productsService.updateStock(item.id, item.cantidad, connection);
        }
      }
    }

    await connection.commit();
    return { id: movimientoId, ...movementData, productos };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.update = async (id, data) => {
  // Nota: La actualización de montos en créditos/abonos es compleja. 
  // Por simplicidad profesional, se recomienda borrar y volver a crear si cambian valores críticos.
  return await model.update(id, data);
};

exports.remove = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Obtener datos del movimiento antes de borrarlo para revertir deuda
    const [rows] = await connection.query('SELECT * FROM movimientos WHERE id = ?', [id]);
    if (rows.length > 0) {
      const mov = rows[0];
      if (mov.cliente_id) {
        if (mov.tipo === 'venta') {
          // Revertir venta crédito: Disminuir deuda
          await connection.query('UPDATE clientes SET deuda = deuda - ? WHERE id = ?', [mov.monto, mov.cliente_id]);
        } else if (mov.tipo === 'abono') {
          // Revertir abono: Aumentar deuda
          await connection.query('UPDATE clientes SET deuda = deuda + ? WHERE id = ?', [mov.monto, mov.cliente_id]);
        }
      }
    }

    // 2. Borrar el movimiento (cascade borrará venta_productos)
    await connection.query('DELETE FROM movimientos WHERE id = ?', [id]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getAllMovements = async () => {
  const movements = await model.findAll();
  const movementIds = movements.map(m => m.id);

  if (movementIds.length > 0) {
    const allProducts = await model.findProductsByMovementIds(movementIds);
    // Agrupar productos por movimiento_id de forma eficiente
    const productsMap = allProducts.reduce((acc, p) => {
      if (!acc[p.movimiento_id]) acc[p.movimiento_id] = [];
      acc[p.movimiento_id].push(p);
      return acc;
    }, {});

    movements.forEach(m => {
      m.productos = productsMap[m.id] || [];
    });
  }

  return movements;
};

exports.getSummary = async () => {
  return await model.getDailySummary();
};

exports.getPeriodicStats = async () => {
  return await model.getPeriodicStats();
};

exports.getDashboardAnalytics = async (days = 30) => {
    const timeSeries = await model.getAnalyticsData(days);
    const [distribution, bottomDistribution, stats] = await Promise.all([
        model.getProductsDistribution(5, 'DESC'),
        model.getProductsDistribution(5, 'ASC'),
        model.getPeriodicStats()
    ]);
    
    return {
        timeSeries,
        distribution,
        bottomDistribution,
        stats
    };
};
