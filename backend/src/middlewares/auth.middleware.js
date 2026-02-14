const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');



async function authUser(req, res, next) {

    
    let token = req.cookies?.token;
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id)

        req.user = user;

        next()

    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }

}

module.exports = {
    authUser
}