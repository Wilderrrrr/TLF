import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Search, User, Phone, Wallet, MoreVertical, Pencil, Trash2, CheckCircle, XCircle, X, FileText, Info, Eye, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';

const API_BASE = '/api/clients';

const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

const ClientsView = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showSettleConfirm, setShowSettleConfirm] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        documento: '',
        telefono: '',
        deuda: '',
        notas: '',
        activo: true
    });

    const fetchData = async () => {
        try {
            const res = await axios.get(API_BASE);
            setClients(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Limpiar documento si está vacío
            const payload = { ...formData };
            if (!payload.documento) payload.documento = null;

            // Si la deuda está vacía:
            // - Al crear: la ponemos en 0 para que Joi no falle.
            // - Al editar: la eliminamos para no sobreescribir el valor actual.
            if (payload.deuda === '') {
                if (editingId) {
                    delete payload.deuda;
                } else {
                    payload.deuda = 0;
                }
            }

            if (editingId) {
                await axios.put(`${API_BASE}/${editingId}`, payload);
            } else {
                await axios.post(API_BASE, payload);
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error al procesar cliente';
            alert(msg);
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            documento: '',
            telefono: '',
            deuda: '',
            notas: '',
            activo: true
        });
        setEditingId(null);
    };

    const handleEdit = (client) => {
        setEditingId(client.id);
        setFormData({
            nombre: client.nombre,
            documento: client.documento || '',
            telefono: client.telefono || '',
            deuda: '', // Aparece vacío según preferencia del usuario
            notas: client.notas || '',
            activo: client.activo === 1 || client.activo === true
        });
        setShowModal(true);
    };

    const handleShowDetail = (client) => {
        setSelectedClient(client);
        setShowDetailModal(true);
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

    const handleSettleDebt = async (client) => {
        try {
            const amount = Number(client.deuda);
            if (amount <= 0) return;

            await axios.post('/api/finance', {
                tipo: 'abono',
                monto: amount,
                descripcion: `${client.nombre} - Salda deuda total`,
                fecha: getLocalDateString(),
                cliente_id: client.id
            });

            setShowSettleConfirm(null);
            fetchData();
        } catch (error) {
            console.error('Error settling debt:', error);
            alert('Error al saldar la deuda');
        }
    };

    const filteredClients = clients.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.documento && c.documento.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Stats
    const totalDeuda = clients.reduce((acc, c) => acc + Number(c.deuda), 0);
    const clientsWithDebt = clients.filter(c => Number(c.deuda) > 0).length;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-8">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Clientes</p>
                            <p className="text-2xl font-bold text-white">{clients.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Deuda Total Cobrable</p>
                            <p className="text-2xl font-bold text-white">${totalDeuda.toLocaleString('es-ES')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-amber-600/10 rounded-2xl text-amber-400">
                            <Info size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Clientes con Deuda</p>
                            <p className="text-2xl font-bold text-white">{clientsWithDebt}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <h3 className="text-xl font-bold text-white whitespace-nowrap">Cartera de Clientes</h3>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o documento..."
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
                        <span>Nuevo</span>
                    </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Cliente</th>
                                <th className="px-6 py-4 font-semibold text-right">Deuda</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg shadow-inner text-blue-400">
                                                {client.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{client.nombre}</p>
                                                <p className="text-xs text-slate-500">{client.documento || 'Sin documento'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <p className={`text-sm font-black ${Number(client.deuda) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                ${Number(client.deuda).toLocaleString('es-ES')}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                                {Number(client.deuda) > 0 ? 'Pendiente' : 'Al día'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2 transition-all">
                                            {Number(client.deuda) > 0 && (
                                                <button
                                                    onClick={() => setShowSettleConfirm(client)}
                                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
                                                    title="Saldar Deuda"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleShowDetail(client)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                                                title="Ver detalle"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(client.id)}
                                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-20 text-center text-slate-500">
                                        No se encontraron clientes que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalle */}
            <Modal 
                isOpen={showDetailModal && !!selectedClient}
                onClose={() => setShowDetailModal(false)}
                maxWidth="max-w-lg"
            >
                <div className="absolute top-0 right-0 p-4">
                    <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-3xl font-bold mb-4 shadow-xl border border-blue-500/20">
                        {selectedClient?.nombre.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-2xl font-bold text-white text-center">{selectedClient?.nombre}</h3>
                    <p className={`mt-2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${selectedClient && Number(selectedClient.deuda) > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {selectedClient && Number(selectedClient.deuda) > 0 ? `Debe $${Number(selectedClient.deuda).toLocaleString('es-ES')}` : 'Al día'}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Info size={18} /></div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-0.5">Documento</p>
                            <p className="text-sm text-white font-medium">{selectedClient?.documento || 'No registrado'}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Phone size={18} /></div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-0.5">Teléfono</p>
                            <p className="text-sm text-white font-medium">{selectedClient?.telefono || 'No registrado'}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><FileText size={18} /></div>
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-0.5">Notas</p>
                            <p className="text-sm text-white/80 leading-relaxed italic">
                                {selectedClient?.notas || 'Sin observaciones adicionales.'}
                            </p>
                        </div>
                    </div>
                </div>

                {selectedClient && Number(selectedClient.deuda) > 0 && (
                    <button
                        onClick={() => {
                            setShowDetailModal(false);
                            setShowSettleConfirm(selectedClient);
                        }}
                        className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2"
                    >
                        <CheckCircle size={20} />
                        <span>Saldar Deuda Total</span>
                    </button>
                )}

                <div className="mt-6 flex space-x-4">
                    <button
                        onClick={() => { setShowDetailModal(false); handleEdit(selectedClient); }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-all border border-slate-700"
                    >
                        Editar Info
                    </button>
                    <button
                        onClick={() => setShowDetailModal(false)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                        Cerrar
                    </button>
                </div>
            </Modal>

            {/* Modal de Confirmación de Eliminación */}
            <Modal 
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                maxWidth="max-w-sm"
                zIndex="z-[110]"
            >
                <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">¿Eliminar?</h3>
                <p className="text-slate-400 text-sm mb-8 text-center">Esta acción no se puede deshacer. Se borrarán todos los registros asociados a este cliente.</p>

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
                        Eliminar
                    </button>
                </div>
            </Modal>

            <Modal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)}
                maxWidth="max-w-lg"
            >
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                        {editingId ? 'Editar' : 'Nuevo'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 ml-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                            placeholder="Ej: Pedro Navaja"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 ml-1">Documento (Opcional)</label>
                            <input
                                type="text"
                                value={formData.documento}
                                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                                placeholder="CC/NIT"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 ml-1">Teléfono</label>
                            <input
                                type="text"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                                placeholder="300 000 0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 ml-1 flex items-center space-x-2">
                            <Wallet size={14} />
                            <span>¿Cuánto quedó debiendo? (Deuda)</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                            <input
                                type="number"
                                value={formData.deuda}
                                onChange={(e) => setFormData({ ...formData, deuda: e.target.value })}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-rose-500 transition-colors text-white font-bold"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 ml-1 flex items-center space-x-2">
                            <FileText size={14} />
                            <span>Notas / Observaciones</span>
                        </label>
                        <textarea
                            value={formData.notas}
                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white h-24 resize-none"
                            placeholder="Detalles importantes..."
                        />
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
                            Guardar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Confirmar Saldar Deuda */}
            <Modal 
                isOpen={!!showSettleConfirm}
                onClose={() => setShowSettleConfirm(null)}
                maxWidth="max-w-sm"
                zIndex="z-[115]"
            >
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-emerald-500/10">
                    <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight text-center">¿Saldar Deuda Total?</h3>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed text-center">
                    Se registrará un abono por <span className="text-emerald-400 font-bold">${showSettleConfirm ? Number(showSettleConfirm.deuda).toLocaleString('es-ES') : 0}</span> para <span className="text-white font-bold">{showSettleConfirm?.nombre}</span>. El dinero se sumará a tu caja de hoy automáticamente.
                </p>
                <div className="flex flex-col space-y-3">
                    <button
                        onClick={() => handleSettleDebt(showSettleConfirm)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        Confirmar y Sumar a Caja
                    </button>
                    <button
                        onClick={() => setShowSettleConfirm(null)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-2xl font-bold transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ClientsView;
