const userModel = require('../users/users.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Por favor proporcione usuario y contraseña'
      });
    }

    // Buscar usuario
    const user = await userModel.findByUsername(usuario);
    if (!user || !user.activo) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas o cuenta inactiva'
      });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas'
      });
    }

    // Generar Token
    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Responder (sin incluir el password)
    const { password: _, ...userSafe } = user;
    
    res.json({
      status: 'success',
      message: 'Login exitoso',
      data: {
        token,
        user: userSafe
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    });
  }
};
