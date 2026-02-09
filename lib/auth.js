const jwt = require('jsonwebtoken');

function verifyAuth(req) {
    const token = req.headers.authorization;

    if (!token) {
        return { error: 'No token, authorization denied', status: 401 };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return { user: decoded.user };
    } catch (err) {
        return { error: 'Token is not valid', status: 401 };
    }
}

module.exports = { verifyAuth };
