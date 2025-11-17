const Usuario = require('./Usuario');
const Libro = require('./Libro');
const Reserva = require('./Reserva');

// Definir relaciones
Usuario.hasMany(Reserva, { foreignKey: 'usuario_id', as: 'reservas' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Libro.hasMany(Reserva, { foreignKey: 'libro_id', as: 'reservas' });
Reserva.belongsTo(Libro, { foreignKey: 'libro_id', as: 'libro' });

module.exports = {
  Usuario,
  Libro,
  Reserva
};

