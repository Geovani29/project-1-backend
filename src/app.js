const express = require('express');
const cors = require('cors');
const { apiReference } = require('@scalar/express-api-reference');
require('dotenv').config();

const usuarioRoutes = require('./routes/usuarioRoutes');
const libroRoutes = require('./routes/libroRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const openApiSpec = require('./config/openapi');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Bienvenido a la API de Biblioteca Digital',
    version: '1.0.0',
    documentacion: '/api/docs',
    endpoints: {
      usuarios: '/usuarios',
      libros: '/libros',
      reservas: '/reservas'
    }
  });
});

app.use(
  '/api/docs',
  apiReference({
    spec: {
      content: openApiSpec
    },
    theme: 'purple',
    darkMode: true,
    layout: 'modern',
    defaultHttpClient: {
      targetKey: 'javascript',
      clientKey: 'fetch'
    },
    authentication: {
      preferredSecurityScheme: 'bearerAuth',
      apiKey: {
        token: ''
      }
    }
  })
);

app.use('/usuarios', usuarioRoutes);
app.use('/libros', libroRoutes);
app.use('/reservas', reservaRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    mensaje: 'El endpoint solicitado no existe'
  });
});

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error del servidor',
    mensaje: err.message || 'Ha ocurrido un error interno'
  });
});

module.exports = app;
