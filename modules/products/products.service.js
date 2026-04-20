const pool = require('../../config/db');

/**
 * Product Service Layer
 */

exports.create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, maneja_stock) VALUES (?, ?, ?, ?, ?, ?)',
    [data.nombre, data.descripcion, data.precio, data.stock || 0, data.stock_minimo || null, data.maneja_stock ?? true]
  );
  return { id: result.insertId, ...data };
};

exports.update = async (id, data) => {
  await pool.query(
    'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, stock_minimo = ?, maneja_stock = ? WHERE id = ?',
    [data.nombre, data.descripcion, data.precio, data.stock, data.stock_minimo || null, data.maneja_stock ?? true, id]
  );
  return { id, ...data };
};

exports.remove = async (id) => {
  await pool.query('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
};

exports.getAll = async () => {
  const [rows] = await pool.query('SELECT * FROM productos WHERE activo = 1 ORDER BY nombre ASC');
  return rows;
};

exports.getLowStock = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM productos WHERE activo = 1 AND maneja_stock = 1 AND stock_minimo IS NOT NULL AND stock <= stock_minimo'
  );
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
  return rows[0];
};

exports.updateStock = async (id, cantidad, connection = pool) => {
  await connection.query(
    'UPDATE productos SET stock = stock - ? WHERE id = ? AND maneja_stock = 1',
    [cantidad, id]
  );
};
