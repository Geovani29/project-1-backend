const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Reserva = sequelize.define('Reserva', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  libro_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'libros',
      key: 'id'
    }
  },
  fecha_reserva: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_entrega_prevista: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterToday(value) {
        if (new Date(value) <= new Date()) {
          throw new Error('La fecha de entrega prevista debe ser futura');
        }
      }
    }
  },
  fecha_entrega_real: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activa', 'devuelta', 'vencida'),
    allowNull: false,
    defaultValue: 'activa',
    validate: {
      isIn: {
        args: [['activa', 'devuelta', 'vencida']],
        msg: 'El estado debe ser activa, devuelta o vencida'
      }
    }
  }
}, {
  tableName: 'reservas',
  timestamps: true
});

module.exports = Reserva;

