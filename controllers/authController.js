import authService from '../services/authService.js';


const discordAuth = async (req, res) => {
    try {
        const discordAuthUrl = process.env.DISCORD_AUTH_URL;
        res.redirect(discordAuthUrl);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const discordAuthCallback = async (req, res) => {
    try {
        // TODO: Implement the discordAuthCallback function
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export { discordAuth, discordAuthCallback }