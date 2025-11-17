const { sequelize, testConnection } = require('../config/db');
const { Usuario } = require('../models');

const crearAdminInicial = async () => {
  try {

    await testConnection();
    await sequelize.sync({ alter: true });

    const adminExistente = await Usuario.findOne({
      where: { rol: 'admin' }
    });

    if (adminExistente) {
      console.log('Ya existe un usuario administrador en el sistema');
      console.log(`         Correo: ${adminExistente.correo}`);
      process.exit(0);
    }

    const permisos = Usuario.asignarPermisosPorRol('admin');

    const admin = await Usuario.create({
      nombre: 'Administrador',
      correo: 'admin@biblioteca.com',
      contraseña: 'admin123',
      rol: 'admin',
      permisos: permisos,
      activo: true
    });

    console.log('Usuario administrador creado exitosamente');
    console.log('Correo:', admin.correo);
    console.log('Contraseña: admin123');
    console.log('IMPORTANTE: Cambia la contraseña después del primer login');

    process.exit(0);
  } catch (error) {
    console.error('Error al crear administrador:', error);
    process.exit(1);
  }
};

crearAdminInicial();
