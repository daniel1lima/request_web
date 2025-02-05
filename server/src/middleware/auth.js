require('dotenv').config(); // Load .env variables

const frontendAuthMiddleware = (req, res, next) => {
    const apiKey = req.header('x-api-key'); // Read API key from request headers
    if (!apiKey || apiKey !== process.env.FRONTEND_API_KEY) {
        //console.log(process.env.FRONTEND_API_KEY)
        return res.status(403).json({ error: 'Unauthorized: Invalid API key' + process.env.FRONTEND_API_KEY});
    }
    next(); // API key is valid, proceed to the next middleware
};

module.exports = frontendAuthMiddleware; 