import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Calendar, Download, 
  Filter, RefreshCcw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

const API_ANALYTICS = '/api/finance/analytics';

const StatCard = ({ title, value, subValue, icon: Icon, trend, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-400 shadow-inner`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
    <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
    <p className="text-xs text-slate-500 mt-2 font-medium">{subValue}</p>
  </motion.div>
);

const DashboardView = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, lowStockRes] = await Promise.all([
        axios.get(`${API_ANALYTICS}?days=${range}`),
        axios.get('/api/products/low-stock')
      ]);
      setData(analyticsRes.data.data);
      setLowStock(lowStockRes.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const exportData = () => {
    if (!data) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Fecha,Ingresos,Egresos\n" 
      + data.timeSeries.map(row => `${row.fecha},${row.ingresos},${row.egresos}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_tlf_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading && !data) return <LoadingSpinner />;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    const trend = Math.round(((current - previous) / previous) * 100);
    return trend > 999 ? 999 : trend; // Limitar a 999% para evitar visuales rotos
  };

  const totalIncoming = data?.timeSeries?.reduce((acc, curr) => acc + Number(curr.ingresos), 0) || 0;
  const totalOutgoing = data?.timeSeries?.reduce((acc, curr) => acc + Number(curr.egresos), 0) || 0;
  const netBalance = totalIncoming - totalOutgoing;

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Header with Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-slate-500 text-sm font-medium">Analítica de rendimiento en tiempo real</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-1 flex">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === d ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
          <button 
            onClick={exportData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-all active:scale-95"
            title="Exportar Reporte CSV"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={fetchAnalytics}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-all active:scale-95"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos (Mes)" 
          value={`$${Number(data?.stats?.mes_ventas || 0).toLocaleString()}`}
          subValue="Ventas del calendario actual"
          icon={TrendingUp}
          color="bg-emerald-500"
          trend={calculateTrend(Number(data?.stats?.mes_ventas || 0), Number(data?.stats?.mes_ventas_anterior || 0))}
        />
        <StatCard 
          title="Gastos (Mes)" 
          value={`$${Number(data?.stats?.mes_gastos || 0).toLocaleString()}`}
          subValue="Registros operativos del mes"
          icon={TrendingDown}
          color="bg-rose-500"
          trend={calculateTrend(Number(data?.stats?.mes_gastos || 0), Number(data?.stats?.mes_gastos_anterior || 0))}
        />
        <StatCard 
          title="Utilidad (Mes)" 
          value={`$${(Number(data?.stats?.mes_ventas || 0) - Number(data?.stats?.mes_gastos || 0)).toLocaleString()}`}
          subValue="Balance bruto mensual"
          icon={DollarSign}
          color="bg-blue-500"
        />
        <StatCard 
          title="Volumen (Periodo)" 
          value={data?.distribution?.length || 0}
          subValue={`Productos con rotación (${range}D)`}
          icon={ShoppingBag}
          color="bg-amber-500"
        />
      </div>

      {/* Critical Alerts Section */}
      <AnimatePresence>
        {lowStock.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Alertas de Inventario Críticas</h3>
                <p className="text-rose-300/70 text-sm">Hay {lowStock.length} producto(s) por debajo del stock mínimo configurado.</p>
              </div>
            </div>
            <div className="flex -space-x-3 overflow-hidden">
                {lowStock.slice(0, 5).map((p, i) => (
                    <div key={p.id} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-rose-500 uppercase" title={p.nombre}>
                        {p.nombre.charAt(0)}
                    </div>
                ))}
                {lowStock.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400">
                        +{lowStock.length - 5}
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white">Análisis de Flujo de Caja</h3>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-xs text-slate-400 font-medium tracking-wide">Ingresos</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-rose-500 rounded-full" />
                    <span className="text-xs text-slate-400 font-medium tracking-wide">Egresos</span>
                </div>
            </div>
          </div>
          <div className="h-[350px] min-h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(str) => str.split('-').slice(1).reverse().join('/')}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => `$${val}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorIngresos)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="egresos" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEgresos)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Distribution Chart */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2">Top Productos</h3>
          <p className="text-slate-500 text-xs mb-8">Distribución por generación de ingresos</p>
          
          <div className="flex-1 h-[250px] min-h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="total_generado"
                  nameKey="nombre"
                  animationDuration={1500}
                >
                  {data?.distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                   itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-6">
            {data?.distribution?.map((item, index) => (
              <div key={item.nombre} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-slate-300 font-medium">{item.nombre}</span>
                </div>
                <span className="text-xs font-bold text-white">${Number(item.total_generado).toLocaleString()}</span>
              </div>
            ))}
            {(!data?.distribution || data.distribution.length === 0) && (
                <div className="text-center py-4 text-slate-600 flex flex-col items-center">
                    <AlertCircle size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">No hay datos de productos suficientes</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Reports & Summary Section */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">Reporte Operativo</h3>
                <p className="text-slate-500 text-xs">Resumen de transacciones del periodo seleccionado</p>
            </div>
            <button 
                onClick={() => navigate('/finanzas')}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-xs font-bold transition-all tracking-widest uppercase"
            >
                <span>Ver todos los movimientos</span>
                <ArrowUpRight size={14} />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center space-x-6 p-6 bg-slate-800/20 rounded-2xl border border-slate-800/50">
                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400">
                    <Calendar size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">Días con actividad</p>
                    <p className="text-xl font-black text-white">{data?.timeSeries.length || 0} Días</p>
                </div>
            </div>
            <div className="flex items-center space-x-6 p-6 bg-slate-800/20 rounded-2xl border border-slate-800/50">
                <div className="w-12 h-12 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-400">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">Día de mayor venta</p>
                    <p className="text-xl font-black text-white">
                        {data?.timeSeries?.length > 0 
                            ? `$${Math.max(...data.timeSeries.map(d => d.ingresos)).toLocaleString()}`
                            : '$0'
                        }
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
