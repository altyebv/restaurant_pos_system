const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const e = require("express");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message: "Email must be in valid format!"
        }
    },

    phone: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return /\d{10}/.test(v);
            },
            message: "Phone number must be a 10-digit number!"
        }
    },

    password: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        required: true,
        enum: ['admin', 'cashier']
    },
    cashierCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        // Format: A1, B1, C1, etc.
        validate: {
            validator: function (v) {
                return /^[A-Z]\d+$/.test(v);
            },
            message: props => `${props.value} is not a valid cashier code! Use format: A1, B1, etc.`
        }
    }
}, { timestamps: true })

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(4);
    this.password = await bcrypt.hash(this.password, salt);
})

module.exports = mongoose.model("User", userSchema);