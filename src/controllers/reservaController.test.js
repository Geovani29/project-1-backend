const {
  createReserva,
  getReservasUsuario,
  getReservasLibro,
  cancelarReserva
} = require('./reservaController');
const { Reserva, Libro, Usuario } = require('../models');

jest.mock('../models');

describe('reservaController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createReserva', () => {
    it('debe crear una reserva exitosamente', async () => {
      req.body = {
        libro_id: 1,
        fecha_entrega_prevista: '2025-12-31'
      };
      req.user = { id: 1 };

      const mockLibro = {
        id: 1,
        disponible: true,
        update: jest.fn().mockResolvedValue(true)
      };

      Libro.findOne = jest.fn().mockResolvedValue(mockLibro);
      Reserva.findOne = jest.fn().mockResolvedValue(null);
      Reserva.create = jest.fn().mockResolvedValue({
        id: 1,
        usuario_id: 1,
        libro_id: 1,
        estado: 'activa'
      });
      Reserva.findOne = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          usuario_id: 1,
          libro_id: 1,
          estado: 'activa',
          libro: {
            id: 1,
            titulo: 'Libro Test'
          },
          usuario: {
            id: 1,
            nombre: 'Usuario Test'
          }
        });

      await createReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Reserva creada exitosamente'
        })
      );
    });

    it('debe fallar si faltan campos requeridos', async () => {
      req.body = {
        libro_id: 1
      };
      req.user = { id: 1 };

      await createReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Datos incompletos'
        })
      );
    });

    it('debe fallar si la fecha no es futura', async () => {
      req.body = {
        libro_id: 1,
        fecha_entrega_prevista: '2020-01-01'
      };
      req.user = { id: 1 };

      await createReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Fecha inválida'
        })
      );
    });

    it('debe fallar si el libro no existe', async () => {
      req.body = {
        libro_id: 999,
        fecha_entrega_prevista: '2025-12-31'
      };
      req.user = { id: 1 };

      Libro.findOne = jest.fn().mockResolvedValue(null);

      await createReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No encontrado'
        })
      );
    });

    it('debe fallar si el libro no está disponible', async () => {
      req.body = {
        libro_id: 1,
        fecha_entrega_prevista: '2025-12-31'
      };
      req.user = { id: 1 };

      const mockLibro = {
        id: 1,
        disponible: false
      };

      Libro.findOne = jest.fn().mockResolvedValue(mockLibro);

      await createReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No disponible'
        })
      );
    });

    it('debe fallar si ya existe una reserva activa del mismo libro', async () => {
      req.body = {
        libro_id: 1,
        fecha_entrega_prevista: '2025-12-31'
      };
      req.user = { id: 1 };

      const mockLibro = {
        id: 1,
        disponible: true
      };

      Libro.findOne = jest.fn().mockResolvedValue(mockLibro);
      Reserva.findOne = jest.fn().mockResolvedValue({
        id: 1,
        usuario_id: 1,
        libro_id: 1,
        estado: 'activa'
      });

      await createReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Reserva duplicada'
        })
      );
    });
  });

  describe('getReservasUsuario', () => {
    it('debe obtener las reservas del usuario exitosamente', async () => {
      req.user = { id: 1 };
      req.query = {};

      Reserva.update = jest.fn().mockResolvedValue([1]);
      Reserva.findAll = jest.fn().mockResolvedValue([
        {
          id: 1,
          usuario_id: 1,
          libro_id: 1,
          estado: 'activa',
          libro: {
            id: 1,
            titulo: 'Libro Test'
          }
        }
      ]);

      await getReservasUsuario(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 1,
          reservas: expect.any(Array)
        })
      );
    });

    it('debe retornar mensaje si no hay reservas', async () => {
      req.user = { id: 1 };
      req.query = {};

      Reserva.update = jest.fn().mockResolvedValue([0]);
      Reserva.findAll = jest.fn().mockResolvedValue([]);

      await getReservasUsuario(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: expect.any(String),
          reservas: []
        })
      );
    });

    it('debe filtrar por estado específico', async () => {
      req.user = { id: 1 };
      req.query = { estado: 'activa' };

      Reserva.update = jest.fn().mockResolvedValue([0]);
      Reserva.findAll = jest.fn().mockResolvedValue([
        {
          id: 1,
          estado: 'activa',
          libro: {}
        }
      ]);

      await getReservasUsuario(req, res);

      expect(Reserva.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            usuario_id: 1,
            estado: 'activa'
          })
        })
      );
    });
  });

  describe('getReservasLibro', () => {
    it('debe obtener las reservas de un libro exitosamente', async () => {
      req.params = { libro_id: '1' };

      const mockLibro = {
        id: 1,
        titulo: 'Libro Test',
        autor: 'Autor Test'
      };

      Libro.findOne = jest.fn().mockResolvedValue(mockLibro);
      Reserva.update = jest.fn().mockResolvedValue([0]);
      Reserva.findAll = jest.fn().mockResolvedValue([
        {
          id: 1,
          libro_id: 1,
          usuario_id: 1,
          estado: 'activa',
          usuario: {
            id: 1,
            nombre: 'Usuario Test'
          }
        }
      ]);

      await getReservasLibro(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          libro: expect.objectContaining({
            id: 1,
            titulo: 'Libro Test'
          }),
          reservas: expect.any(Array)
        })
      );
    });

    it('debe fallar si el libro no existe', async () => {
      req.params = { libro_id: '999' };

      Libro.findOne = jest.fn().mockResolvedValue(null);
      Reserva.update = jest.fn().mockResolvedValue([0]);

      await getReservasLibro(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No encontrado'
        })
      );
    });
  });

  describe('cancelarReserva', () => {
    it('debe devolver un libro exitosamente', async () => {
      req.params = { id: '1' };
      req.user = { id: 1, permisos: [] };

      const mockReserva = {
        id: 1,
        usuario_id: 1,
        libro_id: 1,
        estado: 'activa',
        fecha_entrega_prevista: '2025-12-31',
        update: jest.fn().mockResolvedValue(true),
        libro: {
          id: 1,
          update: jest.fn().mockResolvedValue(true)
        }
      };

      Reserva.findOne = jest.fn().mockResolvedValue(mockReserva);

      await cancelarReserva(req, res);

      expect(mockReserva.update).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'devuelta'
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: expect.any(String)
        })
      );
    });

    it('debe fallar si la reserva no existe', async () => {
      req.params = { id: '999' };
      req.user = { id: 1, permisos: [] };

      Reserva.findOne = jest.fn().mockResolvedValue(null);

      await cancelarReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No encontrado'
        })
      );
    });

    it('debe fallar si no tiene permiso para devolver la reserva', async () => {
      req.params = { id: '1' };
      req.user = { id: 2, permisos: [] };

      const mockReserva = {
        id: 1,
        usuario_id: 1,
        estado: 'activa'
      };

      Reserva.findOne = jest.fn().mockResolvedValue(mockReserva);

      await cancelarReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso denegado'
        })
      );
    });

    it('debe fallar si la reserva ya fue devuelta', async () => {
      req.params = { id: '1' };
      req.user = { id: 1, permisos: [] };

      const mockReserva = {
        id: 1,
        usuario_id: 1,
        estado: 'devuelta'
      };

      Reserva.findOne = jest.fn().mockResolvedValue(mockReserva);

      await cancelarReserva(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Reserva ya devuelta'
        })
      );
    });

    it('debe detectar entrega tardía correctamente', async () => {
      req.params = { id: '1' };
      req.user = { id: 1, permisos: [] };

      const fechaPasada = new Date();
      fechaPasada.setDate(fechaPasada.getDate() - 5);

      const mockReserva = {
        id: 1,
        usuario_id: 1,
        libro_id: 1,
        estado: 'activa',
        fecha_entrega_prevista: fechaPasada.toISOString(),
        update: jest.fn().mockResolvedValue(true),
        libro: {
          id: 1,
          update: jest.fn().mockResolvedValue(true)
        }
      };

      Reserva.findOne = jest.fn().mockResolvedValue(mockReserva);

      await cancelarReserva(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: expect.stringContaining('tardía'),
          entrega_tardia: true
        })
      );
    });
  });
});

