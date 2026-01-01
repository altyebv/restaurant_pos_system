const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");

const isVerifiedUser = async (req, res, next) => {
    try {
        const { accessToken } = req.cookies;
        
        if (!accessToken) {
            const error = createHttpError(401, "Please provide token!");
            return next(error);
        }

        const decodeToken = jwt.verify(accessToken, config.accessTokenSecret);

        // FIXED: Changed from decodeToken._id to decodeToken.id
        // FIXED: User.findById is synchronous, removed await
        const user = User.findById(decodeToken.id);
        
        if (!user) {
            const error = createHttpError(401, "User not exist!");
            return next(error);
        }

        // Remove password from user object before attaching to request
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        
        next();

    } catch (error) {
        const err = createHttpError(401, "Invalid Token!");
        next(err);
    }
};

module.exports = { isVerifiedUser };