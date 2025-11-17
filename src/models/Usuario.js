const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre no puede estar vacío' }
    }
  },
  correo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Este correo ya está registrado'
    },
    validate: {
      isEmail: { msg: 'Debe ser un correo válido' },
      notEmpty: { msg: 'El correo no puede estar vacío' }
    }
  },
  contraseña: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La contraseña no puede estar vacía' },
      len: {
        args: [6, 255],
        msg: 'La contraseña debe tener al menos 6 caracteres'
      }
    }
  },
  rol: {
    type: DataTypes.ENUM('admin', 'editor', 'usuario'),
    allowNull: false,
    defaultValue: 'usuario',
    validate: {
      isIn: {
        args: [['admin', 'editor', 'usuario']],
        msg: 'El rol debe ser admin, editor o usuario'
      }
    }
  },
  permisos: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.contraseña) {
        const salt = await bcrypt.genSalt(10);
        usuario.contraseña = await bcrypt.hash(usuario.contraseña, salt);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('contraseña')) {
        const salt = await bcrypt.genSalt(10);
        usuario.contraseña = await bcrypt.hash(usuario.contraseña, salt);
      }
    }
  }
});

Usuario.prototype.compararContraseña = async function(contraseñaIngresada) {
  return await bcrypt.compare(contraseñaIngresada, this.contraseña);
};

Usuario.asignarPermisosPorRol = (rol) => {
  const permisosPorRol = {
    admin: [
      'crear_usuarios', 'modificar_usuarios', 'inhabilitar_usuarios', 'ver_usuarios', 'administrar_permisos',
      'crear_libros', 'modificar_libros', 'inhabilitar_libros', 'ver_libros', 'listar_libros',
      'reservar_libros', 'ver_reservas_usuario', 'ver_reservas_libro', 'cancelar_reservas'
    ],
    editor: [
      'crear_libros', 'modificar_libros', 'inhabilitar_libros', 'ver_libros', 'listar_libros'
    ],
    usuario: [
      'listar_libros', 'ver_libros', 'reservar_libros', 'ver_reservas_usuario'
    ]
  };
  
  return permisosPorRol[rol] || [];
};

module.exports = Usuario;
