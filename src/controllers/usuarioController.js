const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { Op } = require('sequelize');

const register = async (req, res) => {
  try {
    const { nombre, correo, contraseña, rol } = req.body;

    if (!nombre || !correo || !contraseña) {
      return res.status(400).json({
        error: 'Datos incompletos',
        mensaje: 'Nombre, correo y contraseña son obligatorios'
      });
    }

    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Correo duplicado',
        mensaje: 'Este correo ya está registrado'
      });
    }

    const rolFinal = rol && ['admin', 'editor', 'usuario'].includes(rol) ? rol : 'usuario';
    const permisos = Usuario.asignarPermisosPorRol(rolFinal);

    const nuevoUsuario = await Usuario.create({
      nombre,
      correo,
      contraseña,
      rol: rolFinal,
      permisos,
      activo: true
    });

    const usuarioRespuesta = {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      correo: nuevoUsuario.correo,
      rol: nuevoUsuario.rol,
      permisos: nuevoUsuario.permisos,
      activo: nuevoUsuario.activo
    };

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: usuarioRespuesta
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
      return res.status(400).json({
        error: 'Datos incompletos',
        mensaje: 'Correo y contraseña son obligatorios'
      });
    }

    const usuario = await Usuario.findOne({ where: { correo } });

    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        error: 'Usuario inactivo',
        mensaje: 'Tu cuenta ha sido deshabilitada'
      });
    }

    const contraseñaValida = await usuario.compararContraseña(contraseña);

    if (!contraseñaValida) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        permisos: usuario.permisos
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        permisos: usuario.permisos
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findOne({
      where: { id, activo: true },
      attributes: { exclude: ['contraseña'] }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Usuario no encontrado o inactivo'
      });
    }

    res.json({
      usuario
    });
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, contraseña } = req.body;
    const usuarioAutenticado = req.user;

    const puedeModificar = 
      usuarioAutenticado.id === parseInt(id) || 
      usuarioAutenticado.permisos.includes('modificar_usuarios');

    if (!puedeModificar) {
      return res.status(403).json({
        error: 'Acceso denegado',
        mensaje: 'No tienes permiso para modificar este usuario'
      });
    }

    const usuario = await Usuario.findOne({ where: { id, activo: true } });

    if (!usuario) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Usuario no encontrado o inactivo'
      });
    }

    const datosActualizar = {};
    if (nombre) datosActualizar.nombre = nombre;
    if (correo) {
      const correoExistente = await Usuario.findOne({ 
        where: { correo, id: { [Op.ne]: id } } 
      });
      if (correoExistente) {
        return res.status(400).json({
          error: 'Correo duplicado',
          mensaje: 'Este correo ya está en uso por otro usuario'
        });
      }
      datosActualizar.correo = correo;
    }
    if (contraseña) datosActualizar.contraseña = contraseña;

    await usuario.update(datosActualizar);

    const usuarioActualizado = await Usuario.findOne({
      where: { id },
      attributes: { exclude: ['contraseña'] }
    });

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error en updateUsuario:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const updatePermisosUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, permisos } = req.body;

    const usuario = await Usuario.findOne({ where: { id, activo: true } });

    if (!usuario) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Usuario no encontrado o inactivo'
      });
    }

    const datosActualizar = {};

    if (rol) {
      if (!['admin', 'editor', 'usuario'].includes(rol)) {
        return res.status(400).json({
          error: 'Rol inválido',
          mensaje: 'El rol debe ser admin, editor o usuario'
        });
      }
      datosActualizar.rol = rol;
      datosActualizar.permisos = Usuario.asignarPermisosPorRol(rol);
    }

    if (permisos && Array.isArray(permisos)) {
      datosActualizar.permisos = permisos;
    }

    await usuario.update(datosActualizar);

    const usuarioActualizado = await Usuario.findOne({
      where: { id },
      attributes: { exclude: ['contraseña'] }
    });

    res.json({
      mensaje: 'Permisos actualizados exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error en updatePermisosUsuario:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioAutenticado = req.user;

    const puedeInhabilitar = 
      usuarioAutenticado.id === parseInt(id) || 
      usuarioAutenticado.permisos.includes('inhabilitar_usuarios');

    if (!puedeInhabilitar) {
      return res.status(403).json({
        error: 'Acceso denegado',
        mensaje: 'No tienes permiso para inhabilitar este usuario'
      });
    }

    const usuario = await Usuario.findOne({ where: { id, activo: true } });

    if (!usuario) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Usuario no encontrado o ya está inactivo'
      });
    }

    await usuario.update({ activo: false });

    res.json({
      mensaje: 'Usuario inhabilitado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        activo: false
      }
    });
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getUsuarioById,
  updateUsuario,
  updatePermisosUsuario,
  deleteUsuario
};
