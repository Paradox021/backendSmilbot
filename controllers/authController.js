import * as authService from "../services/authService.js";
import axios from "axios";

const discordAuth = async (req, res) => {
  try {
    const discordAuthUrl = process.env.DISCORD_AUTH_URL;
    res.redirect(discordAuthUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const discordAuthCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const data = {
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "http://localhost:3000/auth/discord/callback",
      scope: "identify email",
    };

    try {
      // Intercambiar el código por un token de acceso
      const tokenResponse = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams(data),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log("tokenResponse: ",tokenResponse.data);
      const accessToken = tokenResponse.data.access_token;

      // Usar el token de acceso para obtener información del usuario
      const userResponse = await axios.get(
        "https://discord.com/api/users/@me",
        {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Aquí tienes la información del usuario
      const user = userResponse.data;
      console.log("usuario: ",user);

      // Procesa o almacena la información del usuario según sea necesario
      // Por ejemplo, podrías crear una sesión de usuario o un registro en tu base de datos

      // Redirige al usuario a una página de éxito o su perfil
      res.status(200).json({ user });
    } catch (error) {
      console.error(
        "Error al intercambiar el código por un token de acceso o al obtener la información del usuario:",
        error
      );
      res.status(500).send("Error interno del servidor");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { discordAuth, discordAuthCallback };
