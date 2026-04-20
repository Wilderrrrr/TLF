import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = ({ movements, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-white capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
        {days.map(day => <div key={day}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDay = isToday(day);

          // Buscar movimientos para este día y categorizarlos
          const dayMovements = movements.filter(m => isSameDay(new Date(m.fecha), day));
          const hasVentasEfectivo = dayMovements.some(m => m.tipo === 'venta' && !m.cliente_id);
          const hasFiados = dayMovements.some(m => m.tipo === 'venta' && m.cliente_id);
          const hasAbonos = dayMovements.some(m => m.tipo === 'abono');
          const hasGastos = dayMovements.some(m => m.tipo === 'gasto');

          return (
            <button
              key={idx}
              onClick={() => onDateClick(day)}
              className={`
                relative h-14 sm:h-20 p-1 sm:p-2 border border-slate-800 transition-all group overflow-hidden
                ${!isCurrentMonth ? 'opacity-20 pointer-events-none' : 'hover:bg-slate-800/50'}
                ${isTodayDay ? 'bg-blue-600/10 border-blue-600/30' : 'bg-slate-900/30'}
                first:rounded-tl-2xl last:rounded-br-2xl
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs sm:text-sm font-bold ${isTodayDay ? 'text-blue-400' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </span>
                {dayMovements.length > 0 && (
                  <div className="w-1 h-1 rounded-full bg-slate-500/50" />
                )}
              </div>

              <div className="mt-auto flex flex-col space-y-0.5 sm:space-y-1">
                {hasVentasEfectivo && <div className="h-0.5 sm:h-1 w-full bg-emerald-500/60 rounded-full" title="Ventas Efectivo" />}
                {hasFiados && <div className="h-0.5 sm:h-1 w-full bg-amber-500/60 rounded-full" title="Ventas Fiado" />}
                {hasAbonos && <div className="h-0.5 sm:h-1 w-full bg-blue-500/60 rounded-full" title="Abonos" />}
                {hasGastos && <div className="h-0.5 sm:h-1 w-full bg-rose-500/60 rounded-full" title="Gastos" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-emerald-500/60 rounded-full" />
          <span>Ventas</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-amber-500/60 rounded-full" />
          <span>Fiados</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-blue-500/60 rounded-full" />
          <span>Abonos</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-rose-500/60 rounded-full" />
          <span>Gastos</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
