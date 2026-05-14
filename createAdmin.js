/**
 * Run this script ONCE to create your admin account.
 * Usage: node createAdmin.js
 * Make sure your .env file is configured with MONGO_URI first.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ADMIN = {
  name: 'Admin Teacher',
  email: 'abubakar4u900@gmail.com',   // <-- change this
  password: 'Admin@123',          // <-- change this
  role: 'admin',
  phone: '+919392648991'          // <-- change this
};

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const exists = await User.findOne({ email: ADMIN.email });
  if (exists) {
    console.log('Admin already exists:', ADMIN.email);
    process.exit(0);
  }

  const admin = await User.create(ADMIN);
  console.log('✅ Admin created successfully!');
  console.log('   Email   :', admin.email);
  console.log('   Password:', ADMIN.password);
  console.log('   Role    :', admin.role);
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
