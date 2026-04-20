const pool = require('../../config/db');

/**
 * Settings & Fixed Expenses Model
 */

// --- METAS ---
exports.getGoal = async () => {
  const [rows] = await pool.query("SELECT valor FROM configuracion WHERE clave = 'meta_mensual'");
  return rows[0] ? rows[0].valor : 0;
};

exports.updateGoal = async (newGoal) => {
  await pool.query(
    "INSERT INTO configuracion (clave, valor) VALUES ('meta_mensual', ?) ON DUPLICATE KEY UPDATE valor = ?",
    [newGoal, newGoal]
  );
  return newGoal;
};

// --- GASTOS FIJOS ---
exports.getFixedExpenses = async () => {
  const [rows] = await pool.query('SELECT * FROM gastos_fijos ORDER BY created_at DESC');
  return rows;
};

exports.addFixedExpense = async ({ descripcion, monto }) => {
  const [result] = await pool.query(
    'INSERT INTO gastos_fijos (descripcion, monto) VALUES (?, ?)',
    [descripcion, monto]
  );
  return { id: result.insertId, descripcion, monto };
};

exports.deleteFixedExpense = async (id) => {
  await pool.query('DELETE FROM gastos_fijos WHERE id = ?', [id]);
  return true;
};

// --- UTILIDAD (Cálculo pro) ---
exports.getFixedExpensesTotal = async () => {
  const [rows] = await pool.query('SELECT SUM(monto) as total FROM gastos_fijos');
  return rows[0].total || 0;
};
