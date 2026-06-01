const model = require('./settings.model');

exports.getConfig = async () => {
  const goal = await model.getGoal();
  
  return {
    meta_mensual: parseFloat(goal),
    gastos_fijos: [],
    total_gastos_fijos: 0
  };
};

exports.updateGoal = async (newGoal) => {
  return await model.updateGoal(newGoal);
};
