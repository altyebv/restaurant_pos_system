// userController.js
const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const Session = require("../models/sessionModel");

const register = async (req, res, next) => {
    try {
        const { name, phone, email, password, role, cashierCode } = req.body; // Add cashierCode

        if(!name || !phone || !email || !password || !role || !cashierCode){ // Add cashierCode check
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({email});
        if(isUserPresent){
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }

        // Check if cashierCode already exists
        const codeExists = await User.findOne({cashierCode: cashierCode.toUpperCase()});
        if(codeExists){
            const error = createHttpError(400, "Cashier code already in use!");
            return next(error);
        }

        const user = { name, phone, email, password, role, cashierCode: cashierCode.toUpperCase() }; // Add cashierCode
        const newUser = User(user);
        await newUser.save();

        res.status(201).json({success: true, message: "New user created!", data: newUser});

    } catch (error) {
        next(error);
    }
}


const login = async (req, res, next) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email });
        if (!isUserPresent) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if (!isMatch) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }


        const jwtSecret = config.accessTokenSecret || process.env.JWT_SECRET || "someSuperRandomString123!@#";
        if (!config.accessTokenSecret || !process.env.JWT_SECRET) {
            console.warn("⚠️  JWT secret not provided in environment; falling back to an internal default. Set `JWT_SECRET` in your .env for production.");
        }

        const accessToken = jwt.sign({ _id: isUserPresent._id }, jwtSecret, {
            expiresIn: '1d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: 'none',
            secure: true
        })

        // Create or reuse an open session for this user so the session starts immediately on login
        try {
            // don't create duplicate open sessions
            let session = await Session.findOne({ cashier: isUserPresent._id, status: 'open' }).sort({ startedAt: -1 });
            if (!session) {
                // fetch last closed session endBalance as default starting balance
                const last = await Session.findOne({ cashier: isUserPresent._id, status: 'closed' }).sort({ endedAt: -1 });
                let defaultStart = 0;
                if (last && typeof last.endBalance === 'number') defaultStart = last.endBalance;
                session = new Session({ cashier: isUserPresent._id, startingBalance: defaultStart });
                // Add an operation to mark session open on login
                session.operations.push({ type: 'session_open', details: { startingBalance: defaultStart }, createdBy: isUserPresent._id });
                await session.save();
            }
            else {
                // If we found an open session, record the login event as an operation in the session
                try {
                    session.operations.push({ type: 'user_login', createdBy: isUserPresent._id });
                    await session.save();
                } catch (opErr) {
                    console.warn('Failed to append user_login op to existing session', opErr.message || opErr);
                }
            }

            res.status(200).json({
                success: true, message: "User login successfully!",
                data: { user: isUserPresent, session }
            });
        } catch (sessionError) {
            console.error("Failed to create/open session during login:", sessionError);
            // We don't want the whole login to fail if session creation fails, still return login success
            res.status(200).json({
                success: true, message: "User login successfully! (session not created)",
                data: { user: isUserPresent }
            });
        }


    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {

        const user = await User.findById(req.user._id);
        res.status(200).json({ success: true, data: user });

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        // Try to find an open session for the user and close it
        try {
            const cashierId = req.user._id;
            let session = await Session.findOne({ cashier: cashierId, status: 'open' }).sort({ startedAt: -1 });
            if (session) {
                // compute totalSales from orders associated with the session
                const orderIds = (session.orders || []);
                let totalSales = 0;
                if (orderIds.length > 0) {
                    const mongoose = require('mongoose');
                    const Order = require('../models/orderModel');
                    const agg = await Order.aggregate([
                        { $match: { _id: { $in: orderIds.map(id => mongoose.Types.ObjectId(id)) } } },
                        { $group: { _id: null, total: { $sum: "$bills.totalWithTax" } } }
                    ]);
                    totalSales = (agg[0] && agg[0].total) || 0;
                }

                // compute totalExpenses already on session
                const totalExpenses = Number(session.totalExpenses || 0);
                // Use existing totalCashCollected if present, otherwise assume equals totalSales
                if (typeof session.totalCashCollected !== 'number' || isNaN(session.totalCashCollected)) {
                    session.totalCashCollected = totalSales;
                }

                session.totalSales = totalSales;
                session.endBalance = Number(session.startingBalance || 0) + Number(session.totalCashCollected || 0) - Number(totalExpenses || 0);
                session.endedAt = new Date();
                session.status = 'closed';
                session.operations.push({ type: 'session_closed', details: { totalSales, totalCashCollected: session.totalCashCollected, totalExpenses }, createdBy: cashierId });
                await session.save();
            }
        } catch (sessionErr) {
            // Log and proceed to logout anyway
            console.warn('Failed to close session during logout for user', req.user && req.user._id, sessionErr.message || sessionErr);
        }

        res.clearCookie('accessToken');
        res.status(200).json({ success: true, message: "User logout successfully!" });

    } catch (error) {
        next(error);
    }
}


// Get all users (managers only)
const getAllUsers = async (req, res, next) => {
    try {
        // Only managers can view all users
        if (req.user.role === 'admin') {
            return next(createHttpError(403, "Access denied. Managers only."));
        }

        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

// Update user
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, cashierCode, password } = req.body;

        // Only managers can update users
        if (req.user.role !== 'manager') {
            return next(createHttpError(403, "Access denied. Managers only."));
        }

        const user = await User.findById(id);
        if (!user) {
            return next(createHttpError(404, "User not found"));
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (cashierCode) user.cashierCode = cashierCode;
        if (password) user.password = password; // Will be hashed by pre-save hook

        await user.save();

        // Return user without password
        const updatedUser = await User.findById(id).select('-password');
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    } catch (error) {
        next(error);
    }
};

// Delete user
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Only managers can delete users
        if (req.user.role !== 'manager') {
            return next(createHttpError(403, "Access denied. Managers only."));
        }

        // Prevent deleting yourself
        if (req.user._id.toString() === id) {
            return next(createHttpError(400, "You cannot delete your own account"));
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return next(createHttpError(404, "User not found"));
        }

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// Update the module.exports at the bottom:
module.exports = {
    register,
    login,
    getUserData,
    logout,
    getAllUsers,
    updateUser,
    deleteUser
};




