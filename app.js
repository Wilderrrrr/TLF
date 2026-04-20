const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const errorMiddleware = require('./middlewares/error.middleware');
const authMiddleware = require('./middlewares/auth.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const financeRoutes = require('./modules/finance/finance.routes');
const settingsRoutes = require('./modules/settings/settings.routes');
const productsRoutes = require('./modules/products/products.routes');
const usersRoutes = require('./modules/users/users.routes');
const clientsRoutes = require('./modules/clients/clients.routes');

const app = express();

// Ruta de Bienvenida (Directo al punto)
app.get('/', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'API Profesional de TLF activa',
    endpoints: {
      finance: '/api/finance',
      health: '/health'
    }
  });
});

// Middlewares Globales
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);

// Rutas Protegidas
app.use('/api/finance', authMiddleware, financeRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/clients', authMiddleware, clientsRoutes);

// Ruta de salud (Health Check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Servir archivos estáticos del Cliente (React) en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));

  // Cualquier otra ruta que no sea API, sirve el index.html de React
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
  });
}

// Capturar 404 para rutas no existentes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `La ruta ${req.originalUrl} no existe en este servidor`
  });
});

// Manejo de errores global
app.use(errorMiddleware);

module.exports = app;
