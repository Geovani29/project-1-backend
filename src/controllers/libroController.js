const { Libro } = require('../models');
const { Op } = require('sequelize');
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination');

const createLibro = async (req, res) => {
  try {
    const { titulo, autor, genero, fecha_publicacion, casa_editorial, disponible } = req.body;

    if (!titulo || !autor || !genero) {
      return res.status(400).json({
        error: 'Datos incompletos',
        mensaje: 'Título, autor y género son obligatorios'
      });
    }

    const nuevoLibro = await Libro.create({
      titulo,
      autor,
      genero,
      fecha_publicacion: fecha_publicacion || null,
      casa_editorial: casa_editorial || null,
      disponible: disponible !== undefined ? disponible : true,
      activo: true
    });

    res.status(201).json({
      mensaje: 'Libro creado exitosamente',
      libro: nuevoLibro
    });
  } catch (error) {
    console.error('Error en createLibro:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const getLibroById = async (req, res) => {
  try {
    const { id } = req.params;

    const libro = await Libro.findOne({
      where: { id, activo: true }
    });

    if (!libro) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Libro no encontrado o inactivo'
      });
    }

    res.json({
      libro
    });
  } catch (error) {
    console.error('Error en getLibroById:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const getLibros = async (req, res) => {
  try {
    const { 
      genero, 
      autor, 
      nombre, 
      casa_editorial, 
      fecha_publicacion,
      disponible,
      page, 
      limit 
    } = req.query;

    const where = { activo: true };

    if (genero) {
      where.genero = { [Op.iLike]: `%${genero}%` };
    }

    if (autor) {
      where.autor = { [Op.iLike]: `%${autor}%` };
    }

    if (nombre) {
      where.titulo = { [Op.iLike]: `%${nombre}%` };
    }

    if (casa_editorial) {
      where.casa_editorial = { [Op.iLike]: `%${casa_editorial}%` };
    }

    if (fecha_publicacion) {
      where.fecha_publicacion = fecha_publicacion;
    }

    if (disponible !== undefined) {
      where.disponible = disponible === 'true' || disponible === true;
    }

    const { offset, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

    const { count, rows } = await Libro.findAndCountAll({
      where,
      attributes: ['titulo'],
      limit: validLimit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const response = buildPaginationResponse(rows, count, validPage, validLimit);

    res.json(response);
  } catch (error) {
    console.error('Error en getLibros:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const updateLibro = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, autor, genero, fecha_publicacion, casa_editorial, disponible } = req.body;

    const libro = await Libro.findOne({ where: { id, activo: true } });

    if (!libro) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Libro no encontrado o inactivo'
      });
    }

    const datosActualizar = {};
    if (titulo) datosActualizar.titulo = titulo;
    if (autor) datosActualizar.autor = autor;
    if (genero) datosActualizar.genero = genero;
    if (fecha_publicacion !== undefined) datosActualizar.fecha_publicacion = fecha_publicacion;
    if (casa_editorial !== undefined) datosActualizar.casa_editorial = casa_editorial;
    if (disponible !== undefined) datosActualizar.disponible = disponible;

    await libro.update(datosActualizar);

    res.json({
      mensaje: 'Libro actualizado exitosamente',
      libro
    });
  } catch (error) {
    console.error('Error en updateLibro:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

const deleteLibro = async (req, res) => {
  try {
    const { id } = req.params;

    const libro = await Libro.findOne({ where: { id, activo: true } });

    if (!libro) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'Libro no encontrado o ya está inactivo'
      });
    }

    await libro.update({ activo: false, disponible: false });

    res.json({
      mensaje: 'Libro inhabilitado exitosamente',
      libro: {
        id: libro.id,
        titulo: libro.titulo,
        activo: false,
        disponible: false
      }
    });
  } catch (error) {
    console.error('Error en deleteLibro:', error);
    res.status(500).json({
      error: 'Error del servidor',
      mensaje: error.message
    });
  }
};

module.exports = {
  createLibro,
  getLibroById,
  getLibros,
  updateLibro,
  deleteLibro
};
