import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, TrendingUp, TrendingDown, Wallet, Calendar as CalendarIcon, Search, CheckCircle, Pencil, Trash2, AlertTriangle, X, Eye, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import Calendar from './Calendar';
import StatsBar from './StatsBar';
import Pagination from './Pagination';
import Modal from './Modal';
import { formatNumber } from '../utils/formatters';

const API_BASE = '/api/finance';

const getLocalDateString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const mapBackendDate = (dateStr) => {
  if (!dateStr) return dateStr;
  let dStr = dateStr;
  if (dateStr instanceof Date) dStr = dateStr.toISOString();
  return dStr.substring(0, 10) + 'T12:00:00';
};

const capitalize = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const StatCard = ({ title, amount, icon: Icon, color, subtitle, trend }) => (
  <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-4 md:p-6 rounded-2xl hover:border-slate-700 transition-all duration-300 group flex flex-row md:flex-col h-full items-center md:items-start relative overflow-hidden">
    {/* Trend Badge - Top Right Always */}
    {trend !== undefined && (
      <div className="absolute top-4 right-4 z-10">
        <span className={`text-[10px] font-black px-2 py-1 rounded-full flex items-center space-x-1 ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' :
          trend < 0 ? 'bg-rose-500/10 text-rose-400' :
            'bg-slate-800 text-slate-400'
          }`}>
          <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '•'}</span>
          <span>{Math.abs(trend)}%</span>
        </span>
      </div>
    )}

    {/* Icon Area */}
    <div className="flex-shrink-0 mb-0 md:mb-6">
      <div className={`p-2.5 md:p-3 rounded-xl bg-opacity-10 ${color}`}>
        <Icon className={`text-opacity-90 ${color.replace('bg-', 'text-')}`} size={20} />
      </div>
    </div>

    {/* Text Area */}
    <div className="flex-1 min-w-0 ml-4 md:ml-0">
      <h3 className="text-slate-400 text-[10px] md:text-sm font-medium mb-0.5 md:mb-1 truncate">{title}</h3>
      <p className="text-lg md:text-2xl font-black text-white tracking-tight">
        ${formatNumber(amount || 0)}
      </p>

      {/* Subtitle - Desktop only or small below */}
      {subtitle && (
        <p className="mt-2 md:mt-4 text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
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
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const INITIAL_FORM_STATE = {
    tipo: 'venta',
    monto: '',
    descripcion: '',
    fecha: getLocalDateString(),
    metodo_pago: 'Efectivo',
    productos: []
  };

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [allProducts, setAllProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [feedbackModal, setFeedbackModal] = useState(null); // { title, message, type: 'error' | 'success' }
  const [isIngresosExpanded, setIsIngresosExpanded] = useState(false);

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
      const mappedMovements = movRes.data.data.map(m => ({ ...m, fecha: mapBackendDate(m.fecha) }));
      setMovements(mappedMovements);

      const mappedSummary = sumRes.data.data.map(s => ({ ...s, fecha: mapBackendDate(s.fecha) }));
      setSummary(mappedSummary);

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

  const handleNew = (date = null) => {
    setEditingId(null);
    setFormData({
      ...INITIAL_FORM_STATE,
      fecha: date ? format(date, 'yyyy-MM-dd') : getLocalDateString()
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      tipo: item.tipo,
      monto: item.monto,
      descripcion: item.descripcion,
      fecha: new Date(item.fecha).toISOString().split('T')[0],
      metodo_pago: item.metodo_pago || 'Efectivo',
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

  // Resetear la expansión de ingresos cuando se cierra el modal del día
  useEffect(() => {
    if (!showDayModal) setIsIngresosExpanded(false);
  }, [showDayModal]);

  const handleNumberChange = (field, value) => {
    const cleanValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [field]: cleanValue });
  };

  const getMovementDescription = (item) => {
    const clientSuffix = item.cliente_nombre ? ` - ${item.cliente_nombre}` : '';

    if (item.tipo === 'venta' && item.productos && item.productos.length === 1) {
      const p = item.productos[0];
      return `x${p.cantidad} ${p.nombre}${clientSuffix}`;
    }
    if (item.tipo === 'venta' && item.productos && item.productos.length > 1) {
      return `Venta${clientSuffix}`;
    }
    return item.descripcion || (item.tipo === 'venta' ? 'Venta' : (item.tipo === 'abono' ? 'Abono' : 'Gasto'));
  };

  const generateDefaultDescription = (tipo, productos, clienteId) => {
    const client = clients.find(c => c.id === clienteId);
    if (tipo === 'venta') {
      let prodPart = 'Venta';
      if (productos && productos.length === 1) {
        prodPart = `x${productos[0].cantidad} ${productos[0].nombre}`;
      }
      return client ? `${prodPart} - ${client.nombre}` : (productos.length > 0 ? prodPart : '');
    }
    if (tipo === 'abono') {
      return client ? `${client.nombre} - Abono` : 'Abono';
    }
    return '';
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
          message: `El monto del abono ($${formatNumber(payload.monto)}) no puede ser mayor a la deuda del cliente ($${formatNumber(selectedClient.deuda)})`,
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
        fecha: getLocalDateString(),
        metodo_pago: 'Efectivo',
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
    const newDefaultDesc = generateDefaultDescription(formData.tipo, newProductos, formData.cliente_id);

    setFormData({
      ...formData,
      productos: newProductos,
      monto: newMonto.toString(),
      descripcion: (!formData.descripcion || formData.descripcion === 'Sin descripción' || formData.descripcion === generateDefaultDescription(formData.tipo, formData.productos, formData.cliente_id))
        ? newDefaultDesc
        : formData.descripcion
    });
  };

  const handleUpdateProductQty = (prodId, qty) => {
    const newProductos = formData.productos.map(p =>
      p.id === prodId ? { ...p, cantidad: parseInt(qty) || 0 } : p
    );
    const newMonto = newProductos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    const newDefaultDesc = generateDefaultDescription(formData.tipo, newProductos, formData.cliente_id);

    setFormData({
      ...formData,
      productos: newProductos,
      monto: newMonto.toString(),
      descripcion: (!formData.descripcion || formData.descripcion === 'Sin descripción' || formData.descripcion === generateDefaultDescription(formData.tipo, formData.productos, formData.cliente_id))
        ? newDefaultDesc
        : formData.descripcion
    });
  };

  const handleRemoveProductFromSale = (prodId) => {
    const newProductos = formData.productos.filter(p => p.id !== prodId);
    const newMonto = newProductos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    const newDefaultDesc = generateDefaultDescription(formData.tipo, newProductos, formData.cliente_id);

    setFormData({
      ...formData,
      productos: newProductos,
      monto: newMonto.toString(),
      descripcion: (!formData.descripcion || formData.descripcion === 'Sin descripción' || formData.descripcion === generateDefaultDescription(formData.tipo, formData.productos, formData.cliente_id))
        ? newDefaultDesc
        : formData.descripcion
    });
  };

  const calculateTrend = (current, previous) => {
    const curr = Number(current || 0);
    const prev = Number(previous || 0);
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const getBadgeColor = (tipo, hasClient) => {
    if (tipo === 'gasto') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (tipo === 'abono') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (tipo === 'venta' && hasClient) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  const getAmountColor = (tipo, hasClient) => {
    if (tipo === 'gasto') return 'text-rose-400';
    if (tipo === 'abono') return 'text-blue-400';
    if (tipo === 'venta' && hasClient) return 'text-amber-400';
    return 'text-emerald-400';
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

  // Lógica de Filtrado y Paginación
  const filteredMovements = movements.filter(m =>
    (m.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.tipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.cliente_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMovements = filteredMovements.slice(indexOfFirstItem, indexOfLastItem);

  const dayMovements = selectedDate ? movements.filter(m => isSameDay(new Date(m.fecha), selectedDate)) : [];
  const { ef: dayIngresosEf, tr: dayIngresosTr } = dayMovements.reduce((acc, m) => {
    if ((m.tipo === 'venta' && !m.cliente_id) || m.tipo === 'abono') {
      if (m.metodo_pago === 'Transferencia') {
        acc.tr += Number(m.monto);
      } else {
        acc.ef += Number(m.monto); // Fallback a Efectivo para registros legacy
      }
    }
    return acc;
  }, { ef: 0, tr: 0 });
  const hasTransfers = dayIngresosTr > 0;
  const hasAnyIncome = dayIngresosEf > 0 || dayIngresosTr > 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Sección de Meta y Progreso */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 md:p-8 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8">
        <div className="space-y-1 md:space-y-2">
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle className="text-blue-500" size={18} />
            <span>Progreso de Meta Mensual</span>
          </h3>
          <p className="text-xs md:text-base text-slate-500 font-medium">
            Meta: <span className="text-white">${formatNumber(config.meta_mensual)}</span>
          </p>
        </div>

        <div className="flex-1 w-full max-w-md space-y-2 md:space-y-3">
          <div className="flex justify-between text-[10px] md:text-sm font-bold">
            <span className="text-blue-400">{progressPercent}% completado</span>
            <span className="text-slate-400">${formatNumber(monthVentas)} / ${formatNumber(config.meta_mensual)}</span>
          </div>
          <div className="h-3 md:h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
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
                  <span className="text-white font-black">${formatNumber(monthVentas - config.meta_mensual)} adicionales</span>
                </span>
              )
              : `Te faltan $${formatNumber(config.meta_mensual - monthVentas)} para el objetivo.`
            }
          </p>
        </div>
      </div>

      {/* Resumen Periódico */}
      <StatsBar stats={stats} totalFixed={config.total_gastos_fijos} />

      {/* Vista de Calendario y Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-full">
          <Calendar movements={movements} onDateClick={handleDateClick} />
        </div>
        <div className="flex flex-col gap-6 h-full">
          <div className="flex-1">
            <StatCard
              title="Ventas del Mes"
              amount={monthVentas}
              icon={TrendingUp}
              color="bg-emerald-500"
              subtitle="Ingresos brutos del periodo actual"
              trend={trendVentas}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title="Gastos Totales"
              amount={monthGastos + config.total_gastos_fijos}
              icon={TrendingDown}
              color="bg-rose-500"
              subtitle={`Variables: $${formatNumber(monthGastos)} | Fijos: $${formatNumber(config.total_gastos_fijos)}`}
              trend={trendGastos}
            />
          </div>
          <div className="flex-1">
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
                className="w-full sm:w-64 bg-slate-800/50 border border-slate-700 rounded-xl py-2 md:py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => handleNew()}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 md:py-2 rounded-xl flex justify-center items-center space-x-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-sm font-semibold"
          >
            <Plus size={18} />
            <span>Nuevo</span>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${item.metodo_pago === 'Transferencia' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`} title={item.metodo_pago}>
                        {item.metodo_pago === 'Transferencia' ? <TrendingUp size={12} /> : <Wallet size={12} />}
                      </div>
                      <span className="text-sm text-slate-100 font-medium">{getMovementDescription(item)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${getBadgeColor(item.tipo, item.cliente_id)}`}>
                      {getBadgeText(item.tipo, item.cliente_id)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-black text-right ${getAmountColor(item.tipo, item.cliente_id)}`}>
                    {item.tipo === 'gasto' ? '-' : '+'}${formatNumber(item.monto)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {item.productos && item.productos.length > 1 && (
                        <button
                          onClick={() => setSelectedSale(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                      )}
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
          totalItems={filteredMovements.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Main Modal - Professional implementation */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-md"
      >
        <h3 className="text-2xl font-bold text-white mb-6">{editingId ? 'Editar' : 'Nuevo'}</h3>
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
                          const newDesc = generateDefaultDescription(formData.tipo, formData.productos, c.id);

                          setFormData({
                            ...formData,
                            cliente_id: c.id,
                            descripcion: (!formData.descripcion || formData.descripcion === 'Sin descripción' || formData.descripcion === generateDefaultDescription(formData.tipo, formData.productos, formData.cliente_id))
                              ? newDesc
                              : formData.descripcion
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
                          <p className="text-xs font-black text-rose-500">${formatNumber(c.deuda)}</p>
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

          {!(formData.tipo === 'venta' && formData.cliente_id) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 mb-4"
            >
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Método de Pago</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Efectivo', icon: Wallet, color: 'emerald' },
                  { id: 'Transferencia', icon: TrendingUp, color: 'blue' }
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, metodo_pago: method.id })}
                    className={`flex items-center justify-center space-x-2 py-3 rounded-xl border-2 transition-all ${formData.metodo_pago === method.id
                      ? `bg-${method.color}-600/10 border-${method.color}-500/50 text-${method.color}-400 shadow-lg shadow-${method.color}-500/5`
                      : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                  >
                    <method.icon size={16} className={formData.metodo_pago === method.id ? `text-${method.color}-400` : 'text-slate-600'} />
                    <span className="text-xs font-bold">{method.id}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
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
                              <p className="text-emerald-400 font-black text-sm">${formatNumber(p.precio)}</p>
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
                      <p className="text-[10px] text-slate-500">${formatNumber(p.precio)} c/u</p>
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
      </Modal>

      {/* Day Details Modal (Premium List) */}
      <Modal
        isOpen={showDayModal && !!selectedDate}
        onClose={() => setShowDayModal(false)}
        maxWidth="max-w-lg"
      >
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/20">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-none">
                {selectedDate && capitalize(format(selectedDate, "eeee, d 'de' MMMM", { locale: es }))}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setShowDayModal(false)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all hover:text-white active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {selectedDate && movements.filter(m => isSameDay(new Date(m.fecha), selectedDate)).length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <CalendarIcon size={32} />
              </div>
              <p className="text-slate-400 font-medium">No hay registros para este día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDate && movements
                .filter(m => isSameDay(new Date(m.fecha), selectedDate))
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex items-center justify-between group hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className={`p-2 rounded-xl bg-opacity-10 flex-shrink-0 ${item.tipo === 'venta'
                        ? (item.cliente_id ? 'bg-amber-500 text-amber-400' : 'bg-emerald-500 text-emerald-400')
                        : (item.tipo === 'abono' ? 'bg-blue-500 text-blue-400' : 'bg-rose-500 text-rose-400')
                        }`}>
                        {item.tipo === 'venta' || item.tipo === 'abono' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {getMovementDescription(item)}
                        </p>
                        <p className={`text-xs font-bold ${getAmountColor(item.tipo, item.cliente_id)}`}>
                          {item.tipo === 'gasto' ? '-' : '+'}${formatNumber(item.monto)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 transition-all">
                      {item.productos && item.productos.length > 1 && (
                        <button
                          onClick={() => setSelectedSale(item)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleEdit(item);
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
          <div className="space-y-4">
            <button 
              type="button"
              onClick={() => hasTransfers && setIsIngresosExpanded(!isIngresosExpanded)}
              disabled={!hasTransfers}
              className={`w-full text-left flex flex-col justify-between transition-all outline-none ${hasTransfers ? 'cursor-pointer hover:bg-emerald-500/10 active:scale-95' : 'cursor-default'} bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl relative overflow-hidden`}
            >
              <div className="w-full flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center">
                    <TrendingUp size={10} className="mr-1" /> Ingresos Hoy
                  </p>
                  <p className="text-xl font-black text-emerald-400">
                    ${formatNumber(dayIngresosEf + dayIngresosTr)}
                  </p>
                </div>
                {hasTransfers && (
                  <motion.div
                    animate={{ rotate: isIngresosExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1 text-emerald-500/50"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                )}
              </div>
              
              <AnimatePresence>
                {isIngresosExpanded && hasTransfers && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="w-full border-t border-emerald-500/10 pt-3 flex flex-col space-y-2 overflow-hidden"
                  >
                    <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <Wallet size={12} className="text-emerald-500/70" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Efectivo</span>
                      </div>
                      <span className="text-sm font-black text-emerald-300/80">${formatNumber(dayIngresosEf)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <TrendingUp size={12} className="text-blue-500/70" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Transferencia</span>
                      </div>
                      <span className="text-sm font-black text-blue-300/80">${formatNumber(dayIngresosTr)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center">
                  <Wallet size={10} className="mr-1" /> Fiados Hoy
                </p>
                <p className="text-lg font-black text-amber-400">
                  ${formatNumber(selectedDate && movements.filter(m => isSameDay(new Date(m.fecha), selectedDate) && (m.tipo === 'venta' && m.cliente_id))
                    .reduce((acc, m) => acc + Number(m.monto), 0))}
                </p>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center">
                  <TrendingDown size={10} className="mr-1" /> Gastos
                </p>
                <p className="text-lg font-black text-rose-400">
                  ${formatNumber(selectedDate && movements.filter(m => isSameDay(new Date(m.fecha), selectedDate) && m.tipo === 'gasto')
                    .reduce((acc, m) => acc + Number(m.monto), 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-1">Balance Neto Real</p>
              <p className={`text-2xl font-black ${selectedDate && movements.filter(m => isSameDay(new Date(m.fecha), selectedDate))
                .reduce((acc, m) => {
                  if ((m.tipo === 'venta' && !m.cliente_id) || m.tipo === 'abono') return acc + Number(m.monto);
                  if (m.tipo === 'gasto') return acc - Number(m.monto);
                  return acc;
                }, 0) >= 0
                ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                ${formatNumber(selectedDate && movements.filter(m => isSameDay(new Date(m.fecha), selectedDate))
                  .reduce((acc, m) => {
                    if ((m.tipo === 'venta' && !m.cliente_id) || m.tipo === 'abono') return acc + Number(m.monto);
                    if (m.tipo === 'gasto') return acc - Number(m.monto);
                    return acc;
                  }, 0))}
              </p>
            </div>
            <button
              onClick={() => handleNew(selectedDate)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 font-bold"
            >
              <Plus size={20} />
              <span>Nuevo</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal (Premium) */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        maxWidth="max-w-sm"
        zIndex="z-[110]"
      >
        <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 text-center">¿Confirmar eliminación?</h3>
        <p className="text-slate-400 text-sm mb-8 text-center">Esta acción no se puede deshacer. Los datos se borrarán permanentemente del sistema.</p>

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
      </Modal>
      {/* Feedback Modal (Premium Alert Replacement) */}
      <Modal
        isOpen={!!feedbackModal}
        onClose={() => setFeedbackModal(null)}
        maxWidth="max-w-sm"
        zIndex="z-[120]"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${feedbackModal?.type === 'error' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'
          }`}>
          {feedbackModal?.type === 'error' ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
        </div>

        <h3 className="text-xl font-bold text-white mb-2 text-center">{feedbackModal?.title}</h3>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed text-center">{feedbackModal?.message}</p>

        <button
          onClick={() => setFeedbackModal(null)}
          className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${feedbackModal?.type === 'error'
            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
        >
          Entendido
        </button>
      </Modal>

      {/* Sale Detail Modal (Premium) */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        maxWidth="max-w-md"
        zIndex="z-[130]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-extrabold text-white tracking-tight">Detalle de Venta</h3>
          <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 mb-6">
          <div className="flex flex-col space-y-4">
            {selectedSale?.productos?.map((p, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                    x{p.cantidad}
                  </div>
                  <span className="text-slate-200 text-sm font-medium">{p.nombre}</span>
                </div>
                <span className="text-slate-400 text-sm">
                  ${formatNumber(Number(p.cantidad) * Number(p.precio_unitario))}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-700 flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Cobrado</span>
            <span className="text-2xl font-black text-emerald-400">
              ${formatNumber(selectedSale?.monto)}
            </span>
          </div>
        </div>

        {selectedSale?.cliente_id && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6 flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-[10px] text-amber-500/70 uppercase font-black">Cliente (Crédito)</p>
              <p className="text-sm text-amber-200 font-bold">{selectedSale.cliente_nombre}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setSelectedSale(null)}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700 shadow-lg active:scale-95"
        >
          Cerrar
        </button>
      </Modal>
    </div>
  );
};

export default FinanceDashboard;
