/**
 * Script to create a demo session for a cashier (existing demo user)
 * Usage: node ./scripts/seedSession.js
 */
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');

const run = async () => {
  await connectDB();
  const user = await User.findOne({ email: 'demo@vision.cafe' }) || await User.findOne();
  if (!user) {
    console.error('No users found. Create a user first.');
    process.exit(1);
  }

  const last = await Session.findOne({ cashier: user._id }).sort({ endedAt: -1 });
  const startingBalance = last ? last.endBalance : 0;

  const session = new Session({ cashier: user._id, startingBalance });
  await session.save();
  console.log('Demo session created:', session._id.toString());
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(2); });
