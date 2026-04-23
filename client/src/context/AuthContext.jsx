import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    // Interceptor para manejar errores 401 (sesión expirada)
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn('Sesión expirada o inválida. Cerrando sesión...');
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Si hay un token guardado, verificar si no ha expirado (opcional pero recomendado)
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    
    setLoading(false);

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const API_URL = import.meta.env.MODE === 'development' 
    ? '' 
    : '';

  const login = async (usuario, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        usuario,
        password
      });

      if (response.data.status === 'success') {
        const { token: newToken, user: userData } = response.data.data;
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(newToken);
        setUser(userData);
        
        // Configurar token para futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return { success: true };
      }
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data.message };
      }
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
