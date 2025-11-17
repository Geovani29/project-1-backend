
const {
  register,
  login,
  getUsuarioById,
  updateUsuario,
  updatePermisosUsuario,
  deleteUsuario
} = require('./usuarioController');
const { Usuario } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

jest.mock('../models');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('usuarioController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debe registrar un usuario exitosamente', async () => {
      req.body = {
        nombre: 'Juan Pérez',
        correo: 'juan@test.com',
        contraseña: '123456',
        rol: 'usuario'
      };

      Usuario.findOne = jest.fn().mockResolvedValue(null);
      Usuario.create = jest.fn().mockResolvedValue({
        id: 1,
        nombre: 'Juan Pérez',
        correo: 'juan@test.com',
        rol: 'usuario',
        permisos: ['listar_libros', 'ver_libros', 'reservar_libros', 'ver_reservas_usuario'],
        activo: true
      });
      Usuario.asignarPermisosPorRol = jest.fn().mockReturnValue(['listar_libros', 'ver_libros', 'reservar_libros', 'ver_reservas_usuario']);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Usuario registrado exitosamente',
          usuario: expect.objectContaining({
            nombre: 'Juan Pérez',
            correo: 'juan@test.com'
          })
        })
      );
    });

    it('debe fallar si faltan campos requeridos', async () => {
      req.body = {
        nombre: 'Juan Pérez'
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Datos incompletos'
        })
      );
    });

    it('debe fallar si el correo ya existe', async () => {
      req.body = {
        nombre: 'Juan Pérez',
        correo: 'juan@test.com',
        contraseña: '123456'
      };

      Usuario.findOne = jest.fn().mockResolvedValue({ correo: 'juan@test.com' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Correo duplicado'
        })
      );
    });
  });

  describe('login', () => {
    it('debe hacer login exitosamente', async () => {
      req.body = {
        correo: 'juan@test.com',
        contraseña: '123456'
      };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez',
        correo: 'juan@test.com',
        rol: 'usuario',
        permisos: ['listar_libros'],
        activo: true,
        compararContraseña: jest.fn().mockResolvedValue(true)
      };

      Usuario.findOne = jest.fn().mockResolvedValue(mockUsuario);
      jwt.sign = jest.fn().mockReturnValue('fake-jwt-token');

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Login exitoso',
          token: 'fake-jwt-token'
        })
      );
    });

    it('debe fallar si faltan credenciales', async () => {
      req.body = {
        correo: 'juan@test.com'
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Datos incompletos'
        })
      );
    });

    it('debe fallar si el usuario no existe', async () => {
      req.body = {
        correo: 'noexiste@test.com',
        contraseña: '123456'
      };

      Usuario.findOne = jest.fn().mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Credenciales inválidas'
        })
      );
    });

    it('debe fallar si el usuario está inactivo', async () => {
      req.body = {
        correo: 'juan@test.com',
        contraseña: '123456'
      };

      Usuario.findOne = jest.fn().mockResolvedValue({
        activo: false
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Usuario inactivo'
        })
      );
    });

    it('debe fallar si la contraseña es incorrecta', async () => {
      req.body = {
        correo: 'juan@test.com',
        contraseña: 'incorrecta'
      };

      const mockUsuario = {
        activo: true,
        compararContraseña: jest.fn().mockResolvedValue(false)
      };

      Usuario.findOne = jest.fn().mockResolvedValue(mockUsuario);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Credenciales inválidas'
        })
      );
    });
  });

  describe('getUsuarioById', () => {
    it('debe obtener un usuario por ID exitosamente', async () => {
      req.params = { id: '1' };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez',
        correo: 'juan@test.com',
        rol: 'usuario'
      };

      Usuario.findOne = jest.fn().mockResolvedValue(mockUsuario);

      await getUsuarioById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario: mockUsuario
        })
      );
    });

    it('debe fallar si el usuario no existe', async () => {
      req.params = { id: '999' };

      Usuario.findOne = jest.fn().mockResolvedValue(null);

      await getUsuarioById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No encontrado'
        })
      );
    });
  });

  describe('updateUsuario', () => {
    it('debe actualizar un usuario exitosamente', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Juan Carlos Pérez' };
      req.user = { id: 1, permisos: [] };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez',
        update: jest.fn().mockResolvedValue(true)
      };

      Usuario.findOne = jest.fn()
        .mockResolvedValueOnce(mockUsuario)
        .mockResolvedValueOnce({
          id: 1,
          nombre: 'Juan Carlos Pérez',
          correo: 'juan@test.com'
        });

      await updateUsuario(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Usuario actualizado exitosamente'
        })
      );
    });

    it('debe fallar si no tiene permiso para modificar', async () => {
      req.params = { id: '2' };
      req.body = { nombre: 'Otro Nombre' };
      req.user = { id: 1, permisos: [] };

      await updateUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso denegado'
        })
      );
    });

    it('debe fallar si el usuario no existe', async () => {
      req.params = { id: '1' };
      req.body = { nombre: 'Nuevo Nombre' };
      req.user = { id: 1, permisos: [] };

      Usuario.findOne = jest.fn().mockResolvedValue(null);

      await updateUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No encontrado'
        })
      );
    });
  });

  describe('updatePermisosUsuario', () => {
    it('debe actualizar permisos exitosamente', async () => {
      req.params = { id: '1' };
      req.body = { rol: 'editor' };

      const mockUsuario = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      Usuario.findOne = jest.fn()
        .mockResolvedValueOnce(mockUsuario)
        .mockResolvedValueOnce({
          id: 1,
          rol: 'editor',
          permisos: ['crear_libros']
        });
      Usuario.asignarPermisosPorRol = jest.fn().mockReturnValue(['crear_libros']);

      await updatePermisosUsuario(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Permisos actualizados exitosamente'
        })
      );
    });

    it('debe fallar si el usuario no existe', async () => {
      req.params = { id: '999' };
      req.body = { rol: 'editor' };

      Usuario.findOne = jest.fn().mockResolvedValue(null);

      await updatePermisosUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No encontrado'
        })
      );
    });

    it('debe fallar si el rol es inválido', async () => {
      req.params = { id: '1' };
      req.body = { rol: 'invalido' };

      Usuario.findOne = jest.fn().mockResolvedValue({ id: 1 });

      await updatePermisosUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rol inválido'
        })
      );
    });
  });

  describe('deleteUsuario', () => {
    it('debe inhabilitar un usuario exitosamente', async () => {
      req.params = { id: '1' };
      req.user = { id: 1, permisos: [] };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez',
        update: jest.fn().mockResolvedValue(true)
      };

      Usuario.findOne = jest.fn().mockResolvedValue(mockUsuario);

      await deleteUsuario(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Usuario inhabilitado exitosamente'
        })
      );
    });

    it('debe fallar si no tiene permiso para inhabilitar', async () => {
      req.params = { id: '2' };
      req.user = { id: 1, permisos: [] };

      await deleteUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso denegado'
        })
      );
    });

    it('debe fallar si el usuario no existe', async () => {
      req.params = { id: '1' };
      req.user = { id: 1, permisos: [] };

      Usuario.findOne = jest.fn().mockResolvedValue(null);

      await deleteUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No encontrado'
        })
      );
    });
  });
});

