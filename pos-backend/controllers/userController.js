const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const Session = require("../models/sessionModel");
const Order = require("../models/orderModel");

const register = async (req, res, next) => {
    try {
        const { name, phone, email, password, role, cashierCode } = req.body;

        if (!name || !phone || !email || !password || !role || !cashierCode) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = User.findOne({ email });
        if (isUserPresent) {
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }

        // Check if cashierCode already exists
        const codeExists = User.findOne({ cashierCode: cashierCode.toUpperCase() });
        if (codeExists) {
            const error = createHttpError(400, "Cashier code already in use!");
            return next(error);
        }

        const newUser = await User.create({ name, phone, email, password, role, cashierCode });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({ 
            success: true, 
            message: "New user created!", 
            data: userWithoutPassword 
        });

    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = User.findOne({ email });
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

        const accessToken = jwt.sign({ id: isUserPresent.id }, jwtSecret, {
            expiresIn: '1d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: 'none',
            secure: true
        });

        // Create or reuse an open session for this user
        try {
            let session = Session.findOne({ cashier_id: isUserPresent.id, status: 'active' });
            
            if (!session) {
                // Fetch last closed session endBalance as default starting balance
                const last = Session.findOne({ cashier_id: isUserPresent.id, status: 'closed' });
                let defaultStart = 0;
                if (last && typeof last.endBalance === 'number') {
                    defaultStart = last.endBalance;
                }

                const operations = [{
                    type: 'session_open',
                    details: { startingBalance: defaultStart },
                    createdAt: new Date().toISOString(),
                    createdBy: isUserPresent.id
                }];

                session = Session.create({
                    cashier: isUserPresent.id,
                    startingBalance: defaultStart,
                    operations
                });
            } else {
                // Record login event in existing session
                try {
                    const operations = [...session.operations];
                    operations.push({
                        type: 'user_login',
                        createdAt: new Date().toISOString(),
                        createdBy: isUserPresent.id
                    });
                    Session.update(session.id, { operations });
                } catch (opErr) {
                    console.warn('Failed to append user_login op to existing session', opErr.message || opErr);
                }
            }

            // Remove password from user object
            const { password: _, ...userWithoutPassword } = isUserPresent;

            res.status(200).json({
                success: true,
                message: "User login successfully!",
                data: { user: userWithoutPassword, session }
            });
        } catch (sessionError) {
            console.error("Failed to create/open session during login:", sessionError);
            
            // Remove password from user object
            const { password: _, ...userWithoutPassword } = isUserPresent;

            res.status(200).json({
                success: true,
                message: "User login successfully! (session not created)",
                data: { user: userWithoutPassword }
            });
        }

    } catch (error) {
        next(error);
    }
};

const getUserData = async (req, res, next) => {
    try {
        const user = User.findByIdSafe(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        // Try to find an open session for the user and close it
        try {
            const cashierId = req.user.id;
            let session = Session.findOne({ cashier_id: cashierId, status: 'active' });
            
            if (session) {
                // Compute totalSales from orders associated with the session
                const orders = Order.findAll({ session_id: session.id });
                
                let totalSales = 0;
                let totalCashCollected = 0;
                
                orders.forEach(order => {
                    const orderTotal = order.bills.totalWithTax || 0;
                    totalSales += orderTotal;
                    if (order.paymentMethod === 'cash') {
                        totalCashCollected += orderTotal;
                    }
                });

                // Use existing totalCashCollected if present
                if (typeof session.totalCashCollected === 'number' && !isNaN(session.totalCashCollected)) {
                    totalCashCollected = session.totalCashCollected;
                }

                const totalExpenses = Number(session.totalExpenses || 0);
                const endBalance = Number(session.startingBalance || 0) + totalCashCollected - totalExpenses;

                // Add closing operation
                const operations = [...session.operations];
                operations.push({
                    type: 'session_closed',
                    details: { totalSales, totalCashCollected, totalExpenses },
                    createdAt: new Date().toISOString(),
                    createdBy: cashierId
                });

                Session.update(session.id, {
                    totalSales,
                    totalCashCollected,
                    totalExpenses,
                    endBalance,
                    endedAt: new Date().toISOString(),
                    status: 'closed',
                    operations
                });
            }
        } catch (sessionErr) {
            console.warn('Failed to close session during logout for user', req.user && req.user.id, sessionErr.message || sessionErr);
        }

        res.clearCookie('accessToken');
        res.status(200).json({ success: true, message: "User logout successfully!" });

    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        // Only managers can view all users
        if (req.user.role !== 'manager') {
            return next(createHttpError(403, "Access denied. Managers only."));
        }

        const users = User.findAllSafe();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, cashierCode, password } = req.body;

        // Only managers can update users
        if (req.user.role !== 'manager') {
            return next(createHttpError(403, "Access denied. Managers only."));
        }

        const user = User.findById(Number(id));
        if (!user) {
            return next(createHttpError(404, "User not found"));
        }

        // Build updates object
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;
        if (role) updates.role = role;
        if (cashierCode) updates.cashierCode = cashierCode;
        if (password) updates.password = password;

        await User.update(Number(id), updates);

        // Return user without password
        const updatedUser = User.findByIdSafe(Number(id));
        res.status(200).json({ 
            success: true, 
            message: "User updated successfully", 
            data: updatedUser 
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Only managers can delete users
        if (req.user.role !== 'manager') {
            return next(createHttpError(403, "Access denied. Managers only."));
        }

        // Prevent deleting yourself
        if (req.user.id === Number(id)) {
            return next(createHttpError(400, "You cannot delete your own account"));
        }

        const deleted = User.delete(Number(id));
        if (!deleted) {
            return next(createHttpError(404, "User not found"));
        }

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getUserData,
    logout,
    getAllUsers,
    updateUser,
    deleteUser
};