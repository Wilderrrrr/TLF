import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Trash2, Plus, Info, CheckCircle, Save } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = '/api/settings';

const SettingsView = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ descripcion: '', monto: '' });
  const [editGoal, setEditGoal] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const itemsPerPage = 5; // Lista más corta para ajustes
  const handleNumberChange = (field, value, isNewExpense = false) => {
    const cleanValue = value.replace(/\D/g, "");
    if (isNewExpense) {
      setNewExpense({ ...newExpense, [field]: cleanValue });
    } else {
      setEditGoal(cleanValue);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await axios.get(API_BASE);
      setConfig(res.data.data);
      setEditGoal(res.data.data.meta_mensual.toString());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const formatNumber = (val) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleUpdateGoal = async () => {
    try {
      const cleanGoal = editGoal.toString().replace(/\./g, '');
      await axios.post(`${API_BASE}/goal`, { meta: cleanGoal });
      await fetchConfig();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      alert('Error actualizando meta');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const cleanMonto = newExpense.monto.toString().replace(/\./g, '');
      await axios.post(`${API_BASE}/fixed-expenses`, {
        ...newExpense,
        monto: cleanMonto
      });
      setNewExpense({ descripcion: '', monto: '' });
      fetchConfig();
    } catch (error) {
      alert('Error agregando gasto');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`${API_BASE}/fixed-expenses/${id}`);
      fetchConfig();
    } catch (error) {
      alert('Error eliminando gasto');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-8 right-8 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center space-x-3 font-bold"
          >
            <CheckCircle size={20} />
            <span>Guardado</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sección de Meta Mensual */}
      <section className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
            <Target size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Meta Mensual</h3>
            <p className="text-slate-500 text-sm">Objetivo de ventas esperado.</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={formatNumber(editGoal)}
              onChange={(e) => handleNumberChange('meta', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white font-bold"
            />
          </div>
          <button 
            onClick={handleUpdateGoal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Save size={18} />
            <span>Guardar</span>
          </button>
        </div>
      </section>

      {/* Sección de Gastos Fijos */}
      <section className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-rose-600/20 rounded-lg text-rose-400">
            <Plus size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Gastos Fijos</h3>
            <p className="text-slate-500 text-sm">Costos automáticos recurrentes (Alquiler, servicios, etc).</p>
          </div>
        </div>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Descripción" 
            required
            value={newExpense.descripcion}
            onChange={(e) => setNewExpense({...newExpense, descripcion: e.target.value})}
            className="md:col-span-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white text-sm"
          />
          <input 
            type="text" 
            placeholder="Monto" 
            required
            value={formatNumber(newExpense.monto)}
            onChange={(e) => handleNumberChange('monto', e.target.value, true)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white text-sm"
          />
          <button 
            type="submit"
            className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all active:scale-95"
          >
            Agregar
          </button>
        </form>

        <div className="space-y-3">
          {config.gastos_fijos
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((expense) => (
            <div key={expense.id} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-800 group">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-slate-200 font-medium">{expense.descripcion}</span>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-white font-bold">${Number(expense.monto).toLocaleString('es-ES')}</span>
                <button 
                  onClick={() => handleDeleteExpense(expense.id)}
                  className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          
          {config.gastos_fijos.length === 0 && (
            <div className="text-center py-8 text-slate-600 italic">
              No hay gastos fijos registrados.
            </div>
          )}
          
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center px-4">
            <span className="text-slate-500 font-medium">Total Gastos Fijos</span>
            <span className="text-rose-400 font-bold text-xl">${config.total_gastos_fijos.toLocaleString('es-ES')}</span>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={config.gastos_fijos.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>

      <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-3xl flex items-start space-x-4">
        <Info className="text-blue-400 shrink-0" size={24} />
        <p className="text-blue-200/80 text-sm leading-relaxed">
          <strong>Tip Profesional:</strong> La meta mensual y los gastos fijos impactan directamente en tu indicador de rentabilidad neta. Mantén estos valores actualizados para ver la salud real de tu negocio en el Dashboard.
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
