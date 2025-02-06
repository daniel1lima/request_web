const jwt = require('jsonwebtoken');

const adminAuthMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.admin_token;
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.admin) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = adminAuthMiddleware; 