const checkPermissions = (permisoRequerido) => {
  return (req, res, next) => {
    try {
      const { permisos } = req.user;

      if (!permisos || !Array.isArray(permisos)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: 'No tienes permisos configurados'
        });
      }

      if (!permisos.includes(permisoRequerido)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: `No tienes el permiso necesario: ${permisoRequerido}`
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

const checkAnyPermission = (permisosRequeridos) => {
  return (req, res, next) => {
    try {
      const { permisos } = req.user;

      if (!permisos || !Array.isArray(permisos)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: 'No tienes permisos configurados'
        });
      }

      const tienePermiso = permisosRequeridos.some(permiso => permisos.includes(permiso));

      if (!tienePermiso) {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: `No tienes ninguno de los permisos necesarios: ${permisosRequeridos.join(', ')}`
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

module.exports = { checkPermissions, checkAnyPermission };
