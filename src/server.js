const app = require('./app');
const { sequelize, testConnection } = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados con la base de datos');

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`API de Biblioteca Digital lista para recibir peticiones`);
      console.log(`Documentación interactiva disponible en http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
