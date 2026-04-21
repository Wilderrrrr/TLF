import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Search, Shield, User, Mail, MoreVertical, Pencil, Trash2, CheckCircle, XCircle, X, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const API_BASE = '/api/users';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    email: '',
    password: '',
    rol: 'vendedor',
    activo: true
  });

  const fetchData = async () => {
    try {
      const res = await axios.get(API_BASE);
      setUsers(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // En edición, si el password está vacío lo quitamos del envío
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        
        await axios.put(`${API_BASE}/${editingId}`, payload);
      } else {
        await axios.post(API_BASE, formData);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al procesar usuario';
      alert(msg);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      usuario: '',
      email: '',
      password: '',
      rol: 'vendedor',
      activo: true
    });
    setEditingId(null);
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      nombre: user.nombre,
      usuario: user.usuario,
      email: user.email || '',
      password: '', // No cargar password
      rol: user.rol,
      activo: user.activo === 1 || user.activo === true
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${showDeleteConfirm}`);
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const toggleStatus = async (user) => {
      try {
          await axios.put(`${API_BASE}/${user.id}`, { activo: !user.activo });
          fetchData();
      } catch (error) {
          alert('Error al cambiar estado');
      }
  };

  const filteredUsers = users.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Header section with Stats or Count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">
                    <User size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Total Usuarios</p>
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
            </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-600/10 rounded-2xl text-emerald-400">
                    <Shield size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Administradores</p>
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.rol === 'admin').length}</p>
                </div>
            </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-600/10 rounded-2xl text-amber-400">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.activo).length}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <h3 className="text-xl font-bold text-white whitespace-nowrap">Gestión de Acceso</h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl flex justify-center items-center space-x-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 font-bold"
          >
            <UserPlus size={18} />
            <span>Agregar Usuario</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${
                        user.rol === 'admin' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {user.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.nombre}</p>
                        <p className="text-xs text-slate-500">@{user.usuario}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <Mail size={14} className="text-slate-500" />
                      <span>{user.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      user.rol === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                        onClick={() => toggleStatus(user)}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        user.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'
                    }`}>
                      {user.activo ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      <span>{user.activo ? 'Activo' : 'Inactivo'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1 transition-all">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-500">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        maxWidth="max-w-lg"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {editingId ? 'Editar Usuario' : 'Crear Usuario'}
          </h3>
          <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1">Nombre de Usuario</label>
              <input
                type="text"
                required
                value={formData.usuario}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                placeholder="Ej: jperez"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">Correo Electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1 flex items-center space-x-2">
              <Key size={14} />
              <span>Contraseña {editingId && <span className="text-[10px] text-blue-400 uppercase ml-2">(Dejar vacío para no cambiar)</span>}</span>
            </label>
            <input
              type="password"
              required={!editingId}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1">Rol de Acceso</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-2xl">
                  {['admin', 'vendedor'].map(r => (
                      <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, rol: r })}
                          className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                              formData.rol === r ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                          {r}
                      </button>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1">Estado de Cuenta</label>
              <button
                  type="button"
                  onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                  className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                      formData.activo 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
              >
                  {formData.activo ? 'ACTIVO' : 'INACTIVO'}
              </button>
            </div>
          </div>

          <div className="pt-4 flex space-x-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              {editingId ? 'Actualizar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        maxWidth="max-w-sm"
        zIndex="z-[110]"
      >
        <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 text-center">¿Eliminar usuario?</h3>
        <p className="text-slate-400 text-sm mb-8 text-center">Esta acción no se puede deshacer. El usuario perderá acceso al sistema inmediatamente.</p>

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
      </Modal>
    </div>
  );
};

export default UsersView;
