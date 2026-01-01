const express = require("express");
const { initDB, closeDB } = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require('morgan');
const app = express();

const PORT = config.port;

// Initialize SQLite database
initDB();

// Middlewares
app.use(cors({
    credentials: true,
    origin: ['http://localhost:5173']
}));
app.use(express.json()); // parse incoming request in json format
app.use(morgan('tiny'));
app.use(cookieParser());

// Root Endpoint
app.get("/", (req, res) => {
    res.json({ message: "Hello from POS Server!" });
});

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/menu", require("./routes/menuRoute"));
app.use("/api/session", require("./routes/sessionRoute"));
// Payment routes removed: using cash-only payments now

// Global Error Handler
app.use(globalErrorHandler);

// Server
const server = app.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(() => {
        closeDB();
        console.log('👋 Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down...');
    server.close(() => {
        closeDB();
        console.log('👋 Server closed');
        process.exit(0);
    });
});