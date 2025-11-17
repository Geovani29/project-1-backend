const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getUsuarioById,
  updateUsuario,
  updatePermisosUsuario,
  deleteUsuario
} = require('../controllers/usuarioController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkPermissions } = require('../middlewares/checkPermissions');

router.post('/register', register);
router.post('/login', login);

router.get('/:id', verifyToken, getUsuarioById);
router.put('/:id', verifyToken, updateUsuario);
router.put('/:id/permisos', verifyToken, checkPermissions('administrar_permisos'), updatePermisosUsuario);
router.delete('/:id', verifyToken, deleteUsuario);

module.exports = router;
