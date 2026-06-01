const pool = require('../../config/db');
const dateUtils = require('../../utils/date');

/**
 * Settings & Fixed Expenses Model
 */

// --- METAS ---
exports.getGoal = async () => {
  const today = dateUtils.getToday();
  const [rows] = await pool.query(
    `SELECT SUM(monto) AS total_gastos 
     FROM movimientos 
     WHERE tipo = 'gasto' 
       AND MONTH(fecha) = MONTH(?) 
       AND YEAR(fecha) = YEAR(?)`,
    [today, today]
  );
  const currentMonthExpenses = rows[0] && rows[0].total_gastos ? parseFloat(rows[0].total_gastos) : 0;
  return 2000000 + (3 * currentMonthExpenses);
};

exports.updateGoal = async (newGoal) => {
  return newGoal;
};

