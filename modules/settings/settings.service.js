const model = require('./settings.model');

exports.getConfig = async () => {
  const goal = await model.getGoal();
  const fixedExpenses = await model.getFixedExpenses();
  const fixedTotal = await model.getFixedExpensesTotal();
  
  return {
    meta_mensual: parseFloat(goal),
    gastos_fijos: fixedExpenses,
    total_gastos_fijos: parseFloat(fixedTotal)
  };
};

exports.updateGoal = async (newGoal) => {
  return await model.updateGoal(newGoal);
};

exports.addFixedExpense = async (data) => {
  return await model.addFixedExpense(data);
};

exports.deleteFixedExpense = async (id) => {
  return await model.deleteFixedExpense(id);
};
