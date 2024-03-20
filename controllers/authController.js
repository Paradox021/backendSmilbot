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

      const jwtAccesToken = await authService.generateToken({
        discordId: user.id,
      }, false);

      const jwtRefreshToken = await authService.generateToken({
        discordId: user.id,
      }, true);

      // Devuelve los tokens al cliente y luego redirige a la página de inicio del front-end
      res.cookie("accessToken", 
        jwtAccesToken, 
        {
          httpOnly: true,
          secure: true,
          sameSite: "none", 
        });
      res.cookie("refreshToken",
        jwtRefreshToken,
        {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
      res.cookie("user",
        JSON.stringify({
            discordId: user.id,
            username: user.username,
            avatar: user.avatar,
        }),
        {
            httpOnly: false,
            secure: true,
            sameSite: "none",
        });

      res.redirect(`${process.env.FRONTEND_URL}/home`);

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

const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;
        // Datos necesarios para la petición de refresh token
        const data = {
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken, 
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
            scope: 'identify email' // Asegúrate de usar el mismo scope que en la autenticación inicial
        };

        // Hacer la petición de refresh token a Discord
        const response = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams(data).toString(), // Discord espera los datos como x-www-form-urlencoded
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Aquí manejas la respuesta, que incluirá un nuevo access_token y refresh_token
        console.log('Nuevos tokens:', response.data);

        // Responde al cliente, posiblemente con los nuevos tokens o un mensaje de éxito
        res.status(200).json({ message: 'Token refrescado con éxito', ...response.data });
    } catch (error) {
        console.error('Error al refrescar el token:', error.response.data);
        res.status(500).json({ error: error.message });
    }
};


export { discordAuth, discordAuthCallback, refreshToken };
