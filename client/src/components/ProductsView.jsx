import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

const API_BASE = '/api/products';

const ProductCard = ({ product, onEdit, onDelete }) => {
  const manejaStock = product.maneja_stock === 1 || product.maneja_stock === true;
  const isLowStock = manejaStock && product.stock_minimo !== null && product.stock <= product.stock_minimo;

  return (
    <div className={`bg-slate-900/40 backdrop-blur-md border p-5 rounded-2xl transition-all group relative overflow-hidden ${isLowStock ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' : 'border-slate-800 hover:border-slate-700'
      }`}>
      {isLowStock && (
        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-amber-500/10 blur-2xl rounded-full" />
      )}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 rounded-xl bg-blue-600/10 text-blue-400">
          <Package size={24} />
        </div>
        <div className="flex space-x-1 transition-opacity">
          <button onClick={() => onEdit(product)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors">
            <Pencil size={16} />
          </button>
          <button onClick={() => onDelete(product.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-white font-bold text-lg mb-1">{product.nombre}</h3>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">{product.descripcion || 'Sin descripción'}</p>

        <div className="flex justify-between items-end mt-4">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Precio</p>
            <p className="text-xl font-bold text-emerald-400">
              ${Math.floor(product.precio).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Disponibilidad</p>
            <div className="flex items-center justify-end space-x-2">
              {isLowStock && (
                <div className="text-amber-500 animate-bounce">
                  <AlertTriangle size={18} />
                </div>
              )}
              <p className={`text-lg font-bold ${!manejaStock ? 'text-blue-400' : (isLowStock ? 'text-amber-500' : product.stock <= 0 ? 'text-rose-500' : 'text-emerald-400')
                }`}>
                {!manejaStock ? 'Disponible' : `${Number(product.stock).toLocaleString()} uds`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    stock_minimo: '',
    maneja_stock: true
  });

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_BASE);
      setProducts(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Bloquear scroll del body cuando hay modales abiertos
  useEffect(() => {
    const isAnyModalOpen = showModal || showDeleteConfirm;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showDeleteConfirm]);

  const formatNumber = (val) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleNumberChange = (field, value) => {
    // Eliminar todo lo que no sea número
    const cleanValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [field]: cleanValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Preparar datos (Limpiar puntos y parsear)
    const payload = {
      ...formData,
      precio: parseInt(formData.precio.toString().replace(/\./g, '')) || 0,
      stock: formData.maneja_stock ? (parseInt(formData.stock.toString().replace(/\./g, '')) || 0) : 0,
      stock_minimo: formData.maneja_stock && formData.stock_minimo !== '' ? parseInt(formData.stock_minimo.toString().replace(/\./g, '')) : null,
      maneja_stock: formData.maneja_stock
    };

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/${editingId}`, payload);
      } else {
        await axios.post(API_BASE, payload);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ nombre: '', descripcion: '', precio: '', stock: '', stock_minimo: '', maneja_stock: true });
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al guardar producto';
      alert(errorMsg);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: Math.floor(product.precio).toString(),
      stock: Math.floor(product.stock).toString(),
      stock_minimo: product.stock_minimo ? Math.floor(product.stock_minimo).toString() : '',
      maneja_stock: product.maneja_stock === 1 || product.maneja_stock === true
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${showDeleteConfirm}`);
      setShowDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      alert('Error al eliminar producto');
    }
  };

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar productos por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ nombre: '', descripcion: '', precio: '', stock: '', stock_minimo: '' });
            setShowModal(true);
          }}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex justify-center items-center space-x-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-base font-bold whitespace-nowrap"
        >
          <Plus size={20} />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
          <Package size={48} className="mb-4 opacity-20" />
          <p className="text-lg">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={setShowDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl w-[95%] md:w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Fila 1: Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                  />
                </div>

                {/* Fila 2: Precio y Toggle Simétrico */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Precio ($)</label>
                    <input
                      type="text"
                      required
                      value={formatNumber(formData.precio)}
                      onChange={(e) => handleNumberChange('precio', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white font-bold text-lg h-[52px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Gestión de Stock</label>
                    <div className="flex items-center justify-between px-4 bg-slate-800 border border-slate-700 rounded-xl h-[52px]">
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {formData.maneja_stock ? "SI" : "NO"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, maneja_stock: !formData.maneja_stock })}
                        className={`w-10 h-5 rounded-full transition-all duration-300 relative flex-shrink-0 ${formData.maneja_stock ? 'bg-blue-600' : 'bg-slate-600'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${formData.maneja_stock ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fila 3: Inventario (Solo si aplica) */}
                <AnimatePresence>
                  {formData.maneja_stock && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Stock Inicial</label>
                          <input
                            type="text"
                            required={formData.maneja_stock}
                            value={formatNumber(formData.stock)}
                            onChange={(e) => handleNumberChange('stock', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Alerta Mínima</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Ej: 5"
                              value={formatNumber(formData.stock_minimo)}
                              onChange={(e) => handleNumberChange('stock_minimo', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-blue-500 transition-colors text-white"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/50">
                              <AlertTriangle size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fila 4: Descripción */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Descripción (Opcional)</label>
                  <textarea
                    rows="2"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white resize-none text-sm"
                  />
                </div>

                {/* Botones */}
                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 py-4 rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
              <h3 className="text-xl font-bold text-white mb-2">¿Eliminar producto?</h3>
              <p className="text-slate-400 text-sm mb-8">Se borrará permanentemente del inventario. Esto no afectará a los registros de ventas pasadas.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsView;
