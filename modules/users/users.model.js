const pool = require('../../config/db');

/**
 * Users Data Access Layer
 */

exports.findAll = async () => {
  const [rows] = await pool.query('SELECT id, nombre, usuario, email, rol, activo, created_at FROM usuarios ORDER BY created_at DESC');
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.query('SELECT id, nombre, usuario, email, rol, activo, created_at FROM usuarios WHERE id = ?', [id]);
  return rows[0];
};

exports.findByUsername = async (usuario) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    return rows[0];
};

exports.create = async ({ nombre, usuario, email, password, rol, activo }) => {
  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, usuario, email, password, rol, activo) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre, usuario, email, password, rol, activo]
  );

  return { id: result.insertId, nombre, usuario, email, rol, activo };
};

exports.update = async (id, fields) => {
    const keys = Object.keys(fields);
    if (keys.length === 0) return null;

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = Object.values(fields);
    
    await pool.query(
        `UPDATE usuarios SET ${setClause} WHERE id = ?`,
        [...values, id]
    );

    return this.findById(id);
};

exports.remove = async (id) => {
  await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  return true;
};
