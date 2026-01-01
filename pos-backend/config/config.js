require("dotenv").config();

const config = Object.freeze({
    port: process.env.PORT || 3000,
    databasePath: process.env.DB_PATH || "./data/pos.db",
    nodeEnv: process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.JWT_SECRET || "someSuperRandomString123!@#",
});

module.exports = config;