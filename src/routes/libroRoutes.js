const express = require('express');
const router = express.Router();
const {
  createLibro,
  getLibroById,
  getLibros,
  updateLibro,
  deleteLibro
} = require('../controllers/libroController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkPermissions } = require('../middlewares/checkPermissions');

router.get('/', getLibros);
router.get('/:id', getLibroById);

router.post('/', verifyToken, checkPermissions('crear_libros'), createLibro);
router.put('/:id', verifyToken, checkPermissions('modificar_libros'), updateLibro);
router.delete('/:id', verifyToken, checkPermissions('inhabilitar_libros'), deleteLibro);

module.exports = router;
