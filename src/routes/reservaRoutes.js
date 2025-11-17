const express = require('express');
const router = express.Router();
const {
  createReserva,
  getReservasUsuario,
  getReservasLibro,
  cancelarReserva
} = require('../controllers/reservaController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkPermissions } = require('../middlewares/checkPermissions');

router.post('/', verifyToken, checkPermissions('reservar_libros'), createReserva);
router.get('/usuario', verifyToken, checkPermissions('ver_reservas_usuario'), getReservasUsuario);
router.get('/libro/:libro_id', verifyToken, checkPermissions('ver_reservas_libro'), getReservasLibro);
router.delete('/:id', verifyToken, cancelarReserva);

module.exports = router;
