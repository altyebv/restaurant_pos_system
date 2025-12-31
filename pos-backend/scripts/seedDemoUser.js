const mongoose = require('mongoose');
const connectDB = require('../config/database');
const config = require('../config/config');
const User = require('../models/userModel');

const seed = async () => {
  try {
    await mongoose.connect(config.databaseURI);
    console.log('Connected to DB');

    const existing = await User.findOne({ email: 'demo@mail' });
    if (existing) {
      console.log('Demo user already exists:', existing.email);
      process.exit(0);
    }

    const demoUser = new User({
      name: 'BA User',
      email: 'best@mail.com',
      phone: 9999999999,
      password: 'demopassword',
      role: 'casheir',
      cashierCode:"B2"
    });

    await demoUser.save();
    console.log('Demo user created: demo@local / demopassword');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
