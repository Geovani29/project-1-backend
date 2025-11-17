const { Reserva, Libro, Usuario } = require('../models');
const { Op } = require('sequelize');

const actualizarReservasVencidas = async () => {
  try {
    const ahora = new Date();
    
    await Reserva.update(
      { estado: 'vencida' },
      {
        where: {
          estado: 'activa',
          fecha_entrega_prevista: {
            [Op.lt]: ahora
          }
        }
      }
    );
  } catch (error) {
    console.error('Error al actualizar reservas vencidas:', error);
  }
};

const createReserva = async (req, res) => {
  try {
    const { libro_id, fecha_entrega_prevista } = req.body;
    const usuario_id = req.user.id;

    if (!libro_id || !fecha_entrega_prevista) {
      return res.status(400).json({
        error: 'Datos incompletos',
        mensaje: 'El ID del libro y la fecha de entrega prevista son obligatorios'
      });
    }

    const fechaPrevista = new Date(fecha_entrega_prevista);
    if (fechaPrevista <= new Date()) {
      return res.status(400).json({
        error: 'Fecha inválida',
        mensaje: 'La fecha de entrega prevista debe ser futura'
      });
    }

    const libro = await Libro.findOne({
      where: { id: libro_id, activo: true }
    });

    if (!libro) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Libro no encontrado o inactivo'
      });
    }

    if (!libro.disponible) {
      return res.status(400).json({
        error: 'No disponible',
        mensaje: 'El libro no está disponible para reservar'
      });
    }

    const reservaExistente = await Reserva.findOne({
      where: {
        usuario_id,
        libro_id,
        estado: 'activa'
      }
    });

    if (reservaExistente) {
      return res.status(400).json({
        error: 'Reserva duplicada',
        mensaje: 'Ya tienes una reserva activa de este libro'
      });
    }

    const nuevaReserva = await Reserva.create({
      usuario_id,
      libro_id,
      fecha_reserva: new Date(),
      fecha_entrega_prevista: fechaPrevista,
      fecha_entrega_real: null,
      estado: 'activa'
    });

    await libro.update({ disponible: false });

    const reservaCompleta = await Reserva.findOne({
      where: { id: nuevaReserva.id },
      include: [
        {
          model: Libro,
          as: 'libro',
          attributes: ['id', 'titulo', 'autor', 'genero']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }
      ]
    });

    res.status(201).json({
      mensaje: 'Reserva creada exitosamente',
      reserva: reservaCompleta
    });
  } catch (error) {
    console.error('Error en createReserva:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const getReservasUsuario = async (req, res) => {
  try {
    await actualizarReservasVencidas();

    const usuario_id = req.user.id;
    const { incluir_finalizadas, estado } = req.query;

    const where = { usuario_id };
    
    if (estado && ['activa', 'devuelta', 'vencida'].includes(estado)) {
      where.estado = estado;
    } else if (incluir_finalizadas !== 'true') {
      where.estado = ['activa', 'vencida'];
    }

    const reservas = await Reserva.findAll({
      where,
      include: [
        {
          model: Libro,
          as: 'libro',
          attributes: ['id', 'titulo', 'autor', 'genero', 'disponible']
        }
      ],
      order: [['fecha_reserva', 'DESC']]
    });

    if (reservas.length === 0) {
      const mensajeEstado = estado 
        ? `No tienes reservas con estado "${estado}"` 
        : incluir_finalizadas === 'true'
          ? 'No tienes reservas'
          : 'No tienes reservas activas';
      
      return res.json({
        mensaje: mensajeEstado,
        reservas: []
      });
    }

    res.json({
      total: reservas.length,
      reservas
    });
  } catch (error) {
    console.error('Error en getReservasUsuario:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const getReservasLibro = async (req, res) => {
  try {
    await actualizarReservasVencidas();

    const { libro_id } = req.params;

    const libro = await Libro.findOne({
      where: { id: libro_id, activo: true }
    });

    if (!libro) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Libro no encontrado o inactivo'
      });
    }

    const reservas = await Reserva.findAll({
      where: { libro_id },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo']
        }
      ],
      order: [['fecha_reserva', 'DESC']]
    });

    res.json({
      libro: {
        id: libro.id,
        titulo: libro.titulo,
        autor: libro.autor
      },
      reservas
    });
  } catch (error) {
    console.error('Error en getReservasLibro:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;
    const tienePemisoAdmin = req.user.permisos.includes('cancelar_reservas');

    const reserva = await Reserva.findOne({
      where: { id },
      include: [
        {
          model: Libro,
          as: 'libro'
        }
      ]
    });

    if (!reserva) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Reserva no encontrada'
      });
    }

    if (reserva.usuario_id !== usuario_id && !tienePemisoAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        mensaje: 'No tienes permiso para devolver esta reserva'
      });
    }

    if (reserva.estado === 'devuelta') {
      return res.status(400).json({
        error: 'Reserva ya devuelta',
        mensaje: 'Esta reserva ya ha sido devuelta'
      });
    }

    const fechaDevolucion = new Date();
    const esEntregaTardia = fechaDevolucion > new Date(reserva.fecha_entrega_prevista);

    await reserva.update({ 
      fecha_entrega_real: fechaDevolucion,
      estado: 'devuelta'
    });

    if (reserva.libro) {
      await reserva.libro.update({ disponible: true });
    }

    res.json({
      mensaje: esEntregaTardia 
        ? 'Reserva devuelta (entrega tardía)'
        : 'Reserva devuelta exitosamente',
      entrega_tardia: esEntregaTardia,
      reserva: {
        id: reserva.id,
        fecha_reserva: reserva.fecha_reserva,
        fecha_entrega_prevista: reserva.fecha_entrega_prevista,
        fecha_entrega_real: reserva.fecha_entrega_real,
        estado: reserva.estado
      }
    });
  } catch (error) {
    console.error('Error en cancelarReserva:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

module.exports = {
  createReserva,
  getReservasUsuario,
  getReservasLibro,
  cancelarReserva
};
