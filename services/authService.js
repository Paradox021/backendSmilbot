import axios from 'axios'
import jwt from 'jsonwebtoken'

const discordAuthCallback = async (code) => {
    // TODO: Implement the discordAuthCallback function using the code to get the user's information
}

const generateToken = async (userInfo, refresh=false) => {
    jwt.sign(userInfo, process.env.JWT_SECRET)
    return jwt.sign(
        { 
            ...userInfo, 
            type: (refresh) ? 'refresh' : 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: (refresh) ? '7d' : '1d' }
    );
}

const verifyToken = async (token, refresh=false) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.message === 'jwt expired') {
            if (refresh) {
                throw new Error('Session expired');
            } else {
                throw new Error('Token expired');
            }
        }
        throw new Error("Invalid token");
    }
}



export { discordAuthCallback, generateToken, verifyToken }