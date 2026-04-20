import React from 'react';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4">
    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
    <p className="text-slate-400 font-medium animate-pulse">Cargando datos...</p>
  </div>
);

export default LoadingSpinner;
