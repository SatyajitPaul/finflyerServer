const jwt = require('jsonwebtoken');
const ErrorResponse = require("../utils/errorResponse");
const User = require('../models/User');


exports.protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(
            new ErrorResponse(
                'You are not authorized to perform this action',
                401
            )
        );
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (err) {
        return next(
            new ErrorResponse(
                'You are not authorized to perform this action',
                401
            )
        );
    }
}