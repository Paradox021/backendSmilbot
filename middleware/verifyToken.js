// middleware/verifyToken.js
import axios from 'axios';
import * as authService from '../services/authService.js';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se encontró token.' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se encontró token.' });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;

  // Si el token es el token del bot, se le permite el acceso
  if (token === botToken) return next();

  try {

    // Verificamos el token jwt del usuario usando jwtverify del authService
    const verifiedToken = authService.verifyToken(token);
    // Se verifica que el usuario esté en la base de datos
    const user = userService.getUser(verifiedToken.discordId);
    // Si el usuario no existe, devuelve un error de autenticación
    if (!user) {
      return res.status(401).json({ message: 'Acceso denegado. Usuario no encontrado.' });
    }
    // Si el usuario existe, se le permite el acceso
    req.user = user;
    next();

  } catch (error) {
    // Si hay un error (por ejemplo, token inválido o expirado), devuelve un error de autenticación
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ message: 'Token inválido o expirado.' });
    } else {
      return res.status(500).json({ message: 'Error al verificar el token.' });
    }
  }
};

export default verifyToken;