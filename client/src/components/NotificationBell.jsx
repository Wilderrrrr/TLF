import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, Package, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_LOW_STOCK = '/api/products/low-stock';

// Un sonido de notificación profesional (Base64)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtvT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vV2U=";

const NotificationBell = ({ onNavToProducts }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const prevCount = useRef(0);
  const audioRef = useRef(null);

  const fetchLowStock = async () => {
    try {
      const res = await axios.get(API_LOW_STOCK);
      const data = res.data.data;
      
      // Si el conteo aumentó, reproducir sonido
      if (data.length > prevCount.current) {
        if (audioRef.current) audioRef.current.play().catch(() => {});
      }
      
      setNotifications(data);
      prevCount.current = data.length;
    } catch (error) {
      console.error('Error fetching low stock notifications:', error);
    }
  };

  useEffect(() => {
    fetchLowStock();
    const interval = setInterval(fetchLowStock, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <audio ref={audioRef} src={NOTIFICATION_SOUND} preload="auto" />
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all relative ${
          notifications.length > 0 
            ? 'bg-rose-600/10 text-rose-500 hover:bg-rose-600/20' 
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        <Bell size={22} className={notifications.length > 0 ? 'animate-pulse' : ''} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Alertas de Inventario</h4>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {notifications.length} ALERTAS
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-600/10 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                      <AlertCircle size={24} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Todo está en orden por aquí</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                            onNavToProducts();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center space-x-4 p-4 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0"
                      >
                        <div className="w-10 h-10 bg-rose-600/10 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                          <Package size={20} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-slate-200 truncate">{item.nombre}</p>
                          <p className="text-xs text-rose-400 font-medium mt-0.5">
                            Stock crítico: <span className="font-black">{item.stock}</span> (Mín: {item.stock_minimo})
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-slate-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <button 
                  onClick={() => {
                      onNavToProducts();
                      setIsOpen(false);
                  }}
                  className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 text-blue-400 text-xs font-bold transition-all uppercase tracking-widest border-t border-slate-800"
                >
                  Ver todos los productos
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
