const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Acceso denegado',
        mensaje: 'No se proporcionó un token de autenticación'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findOne({
      where: { id: decoded.id, activo: true },
      attributes: { exclude: ['contraseña'] }
    });

    if (!usuario) {
      return res.status(401).json({
        error: 'Acceso denegado',
        mensaje: 'Usuario no encontrado o inactivo'
      });
    }

    req.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      permisos: usuario.permisos
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        mensaje: 'El token proporcionado no es válido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        mensaje: 'El token ha expirado, por favor inicia sesión nuevamente'
      });
    }
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

module.exports = { verifyToken };
