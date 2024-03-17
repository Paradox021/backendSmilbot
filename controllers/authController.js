import authService from '../services/authService.js';


const discordAuth = async (req, res) => {
    try {
        const discordAuthUrl = process.env.DISCORD_AUTH_URL;
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export { discordAuth }