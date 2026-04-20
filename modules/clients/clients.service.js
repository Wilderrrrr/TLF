const pool = require('../../config/db');

/**
 * Client Service Layer
 */

exports.getAll = async () => {
  const [rows] = await pool.query('SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre ASC');
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ? AND activo = 1', [id]);
  return rows[0];
};

exports.create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO clientes (nombre, documento, telefono, deuda, notas) VALUES (?, ?, ?, ?, ?)',
    [data.nombre, data.documento, data.telefono || null, data.deuda || 0, data.notas || null]
  );
  return { id: result.insertId, ...data };
};

exports.update = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
  if (data.documento !== undefined) { fields.push('documento = ?'); values.push(data.documento); }
  if (data.telefono !== undefined) { fields.push('telefono = ?'); values.push(data.telefono); }
  if (data.deuda !== undefined) { fields.push('deuda = ?'); values.push(data.deuda); }
  if (data.notas !== undefined) { fields.push('notas = ?'); values.push(data.notas); }
  if (data.activo !== undefined) { fields.push('activo = ?'); values.push(data.activo); }

  if (fields.length === 0) return this.getById(id);

  values.push(id);
  await pool.query(`UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`, values);
  return this.getById(id);
};

exports.remove = async (id) => {
  // Soft delete
  await pool.query('UPDATE clientes SET activo = 0 WHERE id = ?', [id]);
};
