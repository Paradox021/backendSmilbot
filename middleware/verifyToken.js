// middleware/verifyToken.js
import axios from 'axios';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se encontró token.' });
  }
  
  const token = authHeader.split(' ')[1];
  

  const botToken = process.env.DISCORD_BOT_TOKEN;

  // Si el token es el token del bot, se le permite el acceso
  if (token === botToken) return next();

  try {
    // Intenta obtener la información del usuario usando el token
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Si la petición es exitosa, agrega la información del usuario al objeto request y continúa
    req.user = response.data;
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