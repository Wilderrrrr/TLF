import React from 'react';
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

const StatItem = ({ label, value, icon: Icon, color, trend }) => (
  <div className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 relative overflow-hidden group">
    <div className={`p-2 rounded-lg ${color} bg-opacity-10 transition-transform group-hover:scale-110 duration-300`}>
      <Icon size={18} className={`md:w-5 md:h-5 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start">
        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{label}</p>
        {trend !== undefined && (
          <span className={`text-[9px] md:text-[10px] font-black ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-base md:text-lg font-black text-white tracking-tight">${Number(value).toLocaleString('es-ES')}</p>
    </div>
  </div>
);

const StatsBar = ({ stats, totalFixed = 0 }) => {
  if (!stats) return null;

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const trendVentasMes = calculateTrend(Number(stats.mes_ventas), Number(stats.mes_ventas_anterior));
  const trendVentasSemana = calculateTrend(Number(stats.semana_ventas), Number(stats.semana_ventas_anterior));

  const totalMonthGastos = Number(stats.mes_gastos || 0) + Number(totalFixed);
  const prevMonthGastosTotal = Number(stats.mes_gastos_anterior || 0) + Number(totalFixed);
  const trendGastosMes = calculateTrend(totalMonthGastos, prevMonthGastosTotal);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
      <StatItem
        label="Últimos 7 días"
        value={stats.semana_ventas}
        icon={Zap}
        color="bg-amber-400"
        trend={trendVentasSemana}
      />
      <StatItem
        label="Gastos Semanales"
        value={stats.semana_gastos}
        icon={TrendingDown}
        color="bg-rose-400"
      />
      <StatItem
        label="Ventas del Mes"
        value={stats.mes_ventas}
        icon={Target}
        color="bg-emerald-400"
        trend={trendVentasMes}
      />
      <StatItem
        label="Gastos del Mes"
        value={totalMonthGastos}
        icon={TrendingUp}
        color="bg-blue-400"
        trend={trendGastosMes}
      />
    </div>
  );
};

export default StatsBar;
