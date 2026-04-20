import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, TrendingUp, TrendingDown, Wallet, Calendar as CalendarIcon, Search, CheckCircle, Pencil, Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import Calendar from './Calendar';
import StatsBar from './StatsBar';
import Pagination from './Pagination';

const API_BASE = '/api/finance';

const StatCard = ({ title, amount, icon: Icon, color, subtitle, trend }) => (
  <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-opacity-10 ${color}`}>
        <Icon className={`text-opacity-90 ${color.replace('bg-', 'text-')}`} size={24} />
      </div>
      {trend !== undefined && (
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
          trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>
          {trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}% vs anterior
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-black text-white tracking-tight">${Number(amount).toLocaleString()}</p>
    {subtitle && <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">{subtitle}</p>}
  </div>
);

const FinanceDashboard = () => {
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState({ meta_mensual: 10000, total_gastos_fijos: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // ID del movimiento a borrar
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    tipo: 'venta',
    monto: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    productos: [] // [{ id, nombre, precio, cantidad }]
  });
  const [allProducts, setAllProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [feedbackModal, setFeedbackModal] = useState(null); // { title, message, type: 'error' | 'success' }

  const filteredProductsForSale = allProducts.filter(p => 
    p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 5);

  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.documento && c.documento.toLowerCase().includes(clientSearch.toLowerCase()))
  ).slice(0, 5);

  const fetchData = async () => {
    try {
      const [movRes, sumRes, statRes, configRes, clientRes] = await Promise.all([
        axios.get(API_BASE),
        axios.get(`${API_BASE}/summary`),
        axios.get(`${API_BASE}/stats`),
        axios.get('/api/settings'),
        axios.get('/api/clients')
      ]);
      setMovements(movRes.data.data);
      setSummary(sumRes.data.data);
      setStats(statRes.data.data);
      setConfig(configRes.data.data);
      setClients(clientRes.data.data);

      const prodRes = await axios.get('/api/products');
      setAllProducts(prodRes.data.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      tipo: item.tipo,
      monto: item.monto,
      descripcion: item.descripcion,
      fecha: new Date(item.fecha).toISOString().split('T')[0],
      productos: [] // La edición simple no carga productos previos por ahora
    });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${showDeleteConfirm}`);
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Bloquear scroll del body cuando hay modales abiertos
  useEffect(() => {
    const isAnyModalOpen = showModal || showDeleteConfirm || showDayModal || feedbackModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showDeleteConfirm, showDayModal, feedbackModal]);

  const formatNumber = (val) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleNumberChange = (field, value) => {
    const cleanValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [field]: cleanValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Preparar el payload con el monto limpio (quitando puntos)
    const cleanMonto = formData.monto.toString().replace(/\./g, '');
    const payload = {
      ...formData,
      monto: parseFloat(cleanMonto),
      cliente_id: formData.cliente_id || null
    };

    if (isNaN(payload.monto) || payload.monto <= 0) {
      setFeedbackModal({
        title: 'Monto inválido',
        message: 'Por favor ingrese un monto válido mayor a 0',
        type: 'error'
      });
      return;
    }

    if (formData.tipo === 'abono') {
      if (!formData.cliente_id) {
        setFeedbackModal({
          title: 'Selección requerida',
          message: 'Por favor seleccione un cliente para registrar el abono',
          type: 'error'
        });
        return;
      }

      const selectedClient = clients.find(c => c.id === formData.cliente_id);
      if (selectedClient && payload.monto > selectedClient.deuda) {
        setFeedbackModal({
          title: 'Monto excedido',
          message: `El monto del abono ($${payload.monto.toLocaleString()}) no puede ser mayor a la deuda del cliente ($${Number(selectedClient.deuda).toLocaleString()})`,
          type: 'error'
        });
        return;
      }
    }

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/${editingId}`, payload);
      } else {
        await axios.post(API_BASE, payload);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        tipo: 'venta',
        monto: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        productos: [],
        cliente_id: null
      });
      setClientSearch('');
      setProductSearch('');
      fetchData();
      setFeedbackModal({
        title: 'Éxito',
        message: 'Movimiento registrado correctamente',
        type: 'success'
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al procesar movimiento';
      setFeedbackModal({
        title: 'Error de Sistema',
        message: errorMsg,
        type: 'error'
      });
    }
  };

  const handleAddProductToSale = (prodId) => {
    const product = allProducts.find(p => p.id === parseInt(prodId));
    if (!product) return;

    if (formData.productos.some(p => p.id === product.id)) return;

    const newProductos = [...formData.productos, { ...product, cantidad: 1 }];
    const newMonto = newProductos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

    setFormData({
      ...formData,
      productos: newProductos,
      monto: newMonto.toString()
    });
  };

  const handleUpdateProductQty = (prodId, qty) => {
    const newProductos = formData.productos.map(p =>
      p.id === prodId ? { ...p, cantidad: parseInt(qty) || 0 } : p
    );
    const newMonto = newProductos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

    setFormData({
      ...formData,
      productos: newProductos,
      monto: newMonto.toString()
    });
  };

  const handleRemoveProductFromSale = (prodId) => {
    const newProductos = formData.productos.filter(p => p.id !== prodId);
    const newMonto = newProductos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

    setFormData({
      ...formData,
      productos: newProductos,
      monto: newMonto.toString()
    });
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getBadgeColor = (tipo, hasClient) => {
    if (tipo === 'gasto') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (tipo === 'abono') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (tipo === 'venta' && hasClient) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  const getBadgeText = (tipo, hasClient) => {
    if (tipo === 'gasto') return 'Gasto';
    if (tipo === 'abono') return 'Abono';
    if (tipo === 'venta' && hasClient) return 'Crédito';
    return 'Venta';
  };

  const monthVentas = Number(stats?.mes_ventas || 0);
  const monthGastos = Number(stats?.mes_gastos || 0);
  const monthVentasAnt = Number(stats?.mes_ventas_anterior || 0);
  const monthGastosAnt = Number(stats?.mes_gastos_anterior || 0);

  const realBalance = monthVentas - monthGastos - config.total_gastos_fijos;
  const prevRealBalance = monthVentasAnt - monthGastosAnt - config.total_gastos_fijos;

  const trendVentas = calculateTrend(monthVentas, monthVentasAnt);
  const trendGastos = calculateTrend(monthGastos + config.total_gastos_fijos, monthGastosAnt + config.total_gastos_fijos);
  const trendUtilidad = calculateTrend(realBalance, prevRealBalance);

  const progressPercent = Math.min(Math.round((monthVentas / config.meta_mensual) * 100), 100);

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMovements = movements.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Sección de Meta y Progreso */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle className="text-blue-500" size={20} />
            <span>Progreso de Meta Mensual</span>
          </h3>
          <p className="text-slate-500 font-medium">
            Meta: <span className="text-white">${config.meta_mensual.toLocaleString()}</span>
          </p>
        </div>

        <div className="flex-1 w-full max-w-md space-y-3">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-blue-400">{progressPercent}% completado</span>
            <span className="text-slate-400">${monthVentas.toLocaleString()} / ${config.meta_mensual.toLocaleString()}</span>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${progressPercent >= 100 ? 'from-emerald-500 to-teal-400' : 'from-blue-600 to-indigo-500'} shadow-[0_0_15px_rgba(37,99,235,0.4)]`}
            />
          </div>
          <p className="text-xs text-slate-500 text-center">
            {progressPercent >= 100 
              ? (
                <span className="flex items-center justify-center space-x-1">
                  <span className="text-emerald-400 font-bold">¡Meta alcanzada!</span>
                  <span>Estás en zona de profit: </span>
                  <span className="text-white font-black">${(monthVentas - config.meta_mensual).toLocaleString()} adicionales</span>
                </span>
              ) 
              : `Te faltan $${(config.meta_mensual - monthVentas).toLocaleString()} para el objetivo.`
            }
          </p>
        </div>
      </div>

      {/* Resumen Periódico */}
      <StatsBar stats={stats} totalFixed={config.total_gastos_fijos} />

      {/* Vista de Calendario y Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Calendar movements={movements} onDateClick={handleDateClick} />
        </div>

        <div className="space-y-6">
          <StatCard
            title="Ventas del Mes"
            amount={monthVentas}
            icon={TrendingUp}
            color="bg-emerald-500"
            trend={trendVentas}
          />
          <StatCard
            title="Gastos Totales"
            amount={monthGastos + config.total_gastos_fijos}
            icon={TrendingDown}
            color="bg-rose-500"
            subtitle={`Var: $${monthGastos.toLocaleString()} | Fijos: $${config.total_gastos_fijos.toLocaleString()}`}
            trend={trendGastos}
          />
          <div className="pt-4 border-t border-slate-800">
            <StatCard
              title="Utilidad Neta Real"
              amount={realBalance}
              icon={Wallet}
              color="bg-blue-500"
              subtitle="Beneficio final tras todos los costos"
              trend={trendUtilidad}
            />
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center w-full md:w-auto gap-4">
            <h3 className="text-xl font-bold text-white whitespace-nowrap">Últimos Movimientos</h3>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full sm:w-64 bg-slate-800/50 border border-slate-700 rounded-full py-2 md:py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 md:py-2 rounded-xl flex justify-center items-center space-x-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-sm font-semibold"
          >
            <Plus size={18} />
            <span>Nuevo Registro</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold text-right">Monto</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentMovements.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon size={14} className="text-slate-500" />
                      <span>{new Date(item.fecha).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-100 font-medium">{item.descripcion || 'Sin descripción'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${getBadgeColor(item.tipo, item.cliente_id)}`}>
                      {getBadgeText(item.tipo, item.cliente_id)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-black text-right ${
                    item.tipo === 'gasto' ? 'text-rose-400' : 
                    (item.tipo === 'venta' && item.cliente_id ? 'text-amber-400' : 'text-emerald-400')
                  }`}>
                    {item.tipo === 'gasto' ? '-' : '+'}${Number(item.monto).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={movements.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal - Professional implementation */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl w-[95%] md:w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h3 className="text-2xl font-bold text-white mb-6">{editingId ? 'Editar Registro' : 'Nuevo Registro'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-slate-800 p-1.5 rounded-2xl mb-6">
                  {['venta', 'abono', 'gasto'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const isClientType = t === 'venta' || t === 'abono';
                        let newDesc = formData.descripcion;
                        
                        if (isClientType && formData.cliente_id) {
                          const client = clients.find(c => c.id === formData.cliente_id);
                          if (client && (!formData.descripcion || formData.descripcion === 'Sin descripción' || formData.descripcion.includes('- Por cobrar') || formData.descripcion.includes('- Abono'))) {
                            newDesc = t === 'venta' ? `${client.nombre} - Por cobrar` : `${client.nombre} - Abono`;
                          }
                        }

                        setFormData({ 
                          ...formData, 
                          tipo: t, 
                          cliente_id: isClientType ? formData.cliente_id : null, 
                          productos: t === 'venta' ? formData.productos : [],
                          descripcion: newDesc
                        });
                        if (!isClientType) {
                          setProductSearch('');
                          setClientSearch('');
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.tipo === t
                        ? (t === 'venta' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 
                           t === 'abono' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' :
                           'bg-rose-600 text-white shadow-lg shadow-rose-600/20')
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {t === 'venta' ? 'Venta' : t === 'abono' ? 'Abono' : 'Gasto'}
                    </button>
                  ))}
                </div>

                {/* Buscador de Clientes (Si es Abono o Venta) */}
                {(formData.tipo === 'venta' || formData.tipo === 'abono') && (
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50 space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        {formData.tipo === 'abono' ? 'Seleccionar Cliente' : '¿Asociar Cliente? (Opcional)'}
                      </label>
                      {formData.tipo === 'venta' && formData.cliente_id && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Venta a Crédito</span>
                      )}
                    </div>
                    
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <AnimatePresence>
                      {clientSearch && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl divide-y divide-slate-800/30 max-h-40 overflow-y-auto custom-scrollbar"
                        >
                          {filteredClients.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                const newDesc = formData.tipo === 'venta' 
                                  ? `${c.nombre} - Por cobrar` 
                                  : (formData.tipo === 'abono' ? `${c.nombre} - Abono` : formData.descripcion);
                                
                                setFormData({ 
                                  ...formData, 
                                  cliente_id: c.id,
                                  descripcion: (!formData.descripcion || formData.descripcion === 'Sin descripción') ? newDesc : formData.descripcion
                                });
                                setClientSearch('');
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-blue-600/10 transition-colors flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-100">{c.nombre}</p>
                                <p className="text-[10px] text-slate-500 uppercase">{c.documento || 'No Doc'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-rose-500">${Number(c.deuda).toLocaleString()}</p>
                                <p className="text-[8px] text-slate-600 font-bold uppercase">Deuda</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {formData.cliente_id && (
                      <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-blue-600/20 rounded-lg text-blue-400">
                            <CheckCircle size={14} />
                          </div>
                          <span className="text-xs font-bold text-white">{clients.find(c => c.id === formData.cliente_id)?.nombre}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => { setFormData({ ...formData, cliente_id: null }); setClientSearch(''); }}
                          className="text-slate-500 hover:text-rose-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Monto ($)</label>
                  <input
                    type="text"
                    required
                    value={formatNumber(formData.monto)}
                    onChange={(e) => handleNumberChange('monto', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Descripción</label>
                  <input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                  />
                </div>
                {formData.tipo === 'venta' && (
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-blue-400 uppercase tracking-wider">Asociar Productos</label>
                    </div>

                    {/* Buscador de Productos Premium */}
                    <div className="space-y-4">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                          type="text"
                          placeholder="Buscar producto a vender..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner placeholder:text-slate-600"
                        />
                      </div>

                      <AnimatePresence>
                        {productSearch && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl divide-y divide-slate-800/50 max-h-60 overflow-y-auto custom-scrollbar"
                          >
                            {allProducts.filter(p => 
                              p.nombre.toLowerCase().includes(productSearch.toLowerCase()) || 
                              (p.descripcion && p.descripcion.toLowerCase().includes(productSearch.toLowerCase()))
                            ).length > 0 ? (
                              allProducts.filter(p => 
                                p.nombre.toLowerCase().includes(productSearch.toLowerCase()) || 
                                (p.descripcion && p.descripcion.toLowerCase().includes(productSearch.toLowerCase()))
                              ).slice(0, 10).map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  disabled={formData.productos.some(sp => sp.id === p.id)}
                                  onClick={() => {
                                    handleAddProductToSale(p.id);
                                    setProductSearch('');
                                  }}
                                  className="w-full text-left px-5 py-3 hover:bg-blue-600/10 flex justify-between items-center transition-all disabled:opacity-40 disabled:grayscale group"
                                >
                                  <div className="min-w-0 mr-4">
                                    <p className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors truncate">{p.nombre}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                      {p.maneja_stock ? `Stock: ${p.stock}` : 'Servicio/Ilimitado'}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-emerald-400 font-black text-sm">${Number(p.precio).toLocaleString()}</p>
                                    <p className="text-[8px] text-slate-600 uppercase font-bold">Precio Unitario</p>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="p-8 text-center bg-slate-950/20">
                                <AlertTriangle className="mx-auto mb-2 text-slate-700" size={24} />
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                  No hay coincidencias
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Lista de Productos Seleccionados */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar pt-2 border-t border-slate-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Items en la venta</span>
                        {formData.productos.length > 0 && (
                          <span className="text-[10px] font-black text-blue-500 uppercase">{formData.productos.length} productos</span>
                        )}
                      </div>
                      {formData.productos.map(p => (
                        <motion.div 
                          layout
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          key={p.id} 
                          className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-sm"
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-xs font-bold text-white truncate">{p.nombre}</p>
                            <p className="text-[10px] text-slate-500">${Number(p.precio).toLocaleString()} c/u</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2">
                              <span className="text-[10px] text-slate-500 mr-2 font-bold uppercase">Cant:</span>
                              <input
                                type="text"
                                required
                                value={formatNumber(p.cantidad)}
                                onChange={(e) => handleUpdateProductQty(p.id, e.target.value.replace(/\D/g, ''))}
                                className="w-12 bg-transparent py-1 text-center text-xs text-white font-bold focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveProductFromSale(p.id)}
                              className="text-slate-600 hover:text-rose-500 p-2 hover:bg-rose-500/10 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      {formData.productos.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                          <p className="text-xs text-slate-600 font-medium">Búsca productos para agregarlos a la venta</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="pt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 py-3 rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Day Details Modal (Premium List) */}
      <AnimatePresence>
        {showDayModal && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDayModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl w-[95%] md:w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {format(selectedDate, 'eeee d', { locale: es })}
                  </h3>
                  <p className="text-slate-500 text-sm capitalize">
                    {format(selectedDate, 'MMMM yyyy', { locale: es })}
                  </p>
                </div>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {movements.filter(m => isSameDay(new Date(m.fecha), selectedDate)).length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                      <CalendarIcon size={32} />
                    </div>
                    <p className="text-slate-400 font-medium">No hay registros para este día</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {movements
                      .filter(m => isSameDay(new Date(m.fecha), selectedDate))
                      .map((item) => (
                        <div 
                          key={item.id} 
                          className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex items-center justify-between group hover:border-slate-600 transition-all"
                        >
                          <div className="flex items-center space-x-4 min-w-0">
                            <div className={`p-2 rounded-xl bg-opacity-10 flex-shrink-0 ${
                              item.tipo === 'venta' 
                                ? (item.cliente_id ? 'bg-amber-500 text-amber-400' : 'bg-emerald-500 text-emerald-400')
                                : (item.tipo === 'abono' ? 'bg-blue-500 text-blue-400' : 'bg-rose-500 text-rose-400')
                            }`}>
                              {item.tipo === 'venta' || item.tipo === 'abono' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">
                                {item.descripcion || (item.tipo === 'venta' ? 'Venta de productos' : (item.tipo === 'abono' ? 'Abono de cliente' : 'Gasto registrado'))}
                              </p>
                              <p className={`text-xs font-bold ${
                                item.tipo === 'gasto' ? 'text-rose-400' : 
                                (item.tipo === 'venta' && item.cliente_id ? 'text-amber-400' : 'text-emerald-400')
                              }`}>
                                {item.tipo === 'gasto' ? '-' : '+'}${Number(item.monto).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 transition-all">
                            <button
                              onClick={() => {
                                handleEdit(item);
                                // setShowDayModal(false); // Mantener abierto o cerrar segun prefiera
                              }}
                              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(item.id)}
                              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center">
                      <TrendingUp size={10} className="mr-1" /> Ingresos Hoy
                    </p>
                    <p className="text-lg font-black text-emerald-400">
                      ${movements.filter(m => isSameDay(new Date(m.fecha), selectedDate) && ((m.tipo === 'venta' && !m.cliente_id) || m.tipo === 'abono'))
                        .reduce((acc, m) => acc + Number(m.monto), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center">
                      <Wallet size={10} className="mr-1" /> Fiados Hoy
                    </p>
                    <p className="text-lg font-black text-amber-400">
                      ${movements.filter(m => isSameDay(new Date(m.fecha), selectedDate) && (m.tipo === 'venta' && m.cliente_id))
                        .reduce((acc, m) => acc + Number(m.monto), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center">
                      <TrendingDown size={10} className="mr-1" /> Gastos
                    </p>
                    <p className="text-lg font-black text-rose-400">
                      ${movements.filter(m => isSameDay(new Date(m.fecha), selectedDate) && m.tipo === 'gasto')
                        .reduce((acc, m) => acc + Number(m.monto), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-1">Balance Neto Real</p>
                    <p className={`text-2xl font-black ${
                      movements.filter(m => isSameDay(new Date(m.fecha), selectedDate))
                        .reduce((acc, m) => {
                          if ((m.tipo === 'venta' && !m.cliente_id) || m.tipo === 'abono') return acc + Number(m.monto);
                          if (m.tipo === 'gasto') return acc - Number(m.monto);
                          return acc;
                        }, 0) >= 0 
                        ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      ${movements.filter(m => isSameDay(new Date(m.fecha), selectedDate))
                          .reduce((acc, m) => {
                            if ((m.tipo === 'venta' && !m.cliente_id) || m.tipo === 'abono') return acc + Number(m.monto);
                            if (m.tipo === 'gasto') return acc - Number(m.monto);
                            return acc;
                          }, 0)
                          .toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        tipo: 'venta',
                        monto: '',
                        descripcion: '',
                        fecha: format(selectedDate, 'yyyy-MM-dd'),
                        productos: []
                      });
                      setShowModal(true);
                    }}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 font-bold"
                  >
                    <Plus size={20} />
                    <span>Nuevo Movimiento</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (Premium) */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl w-[95%] md:w-full max-w-sm shadow-2xl text-center max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¿Confirmar eliminación?</h3>
              <p className="text-slate-400 text-sm mb-8">Esta acción no se puede deshacer. Los datos se borrarán permanentemente del sistema.</p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Feedback Modal (Premium Alert Replacement) */}
      <AnimatePresence>
        {feedbackModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeedbackModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 p-8 rounded-3xl w-[95%] md:w-full max-w-sm shadow-2xl text-center"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                feedbackModal.type === 'error' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {feedbackModal.type === 'error' ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{feedbackModal.title}</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">{feedbackModal.message}</p>

              <button
                onClick={() => setFeedbackModal(null)}
                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${
                  feedbackModal.type === 'error' 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceDashboard;
