const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Libro = sequelize.define('Libro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El título no puede estar vacío' }
    }
  },
  autor: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El autor no puede estar vacío' }
    }
  },
  genero: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El género no puede estar vacío' }
    }
  },
  fecha_publicacion: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  casa_editorial: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'libros',
  timestamps: true
});

module.exports = Libro;

