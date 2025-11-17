const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    try {
      const { rol } = req.user;

      if (!rol) {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: 'No tienes un rol asignado'
        });
      }

      if (!rolesPermitidos.includes(rol)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: `Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: 'Error del servidor',
        mensaje: error.message
      });
    }
  };
};

module.exports = { checkRole };
