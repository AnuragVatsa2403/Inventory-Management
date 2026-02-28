const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

async function reset() {
  try {
    console.log('Connecting...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected');

    // Delete ALL users
    const del = await mongoose.connection.collection('users').deleteMany({});
    console.log('✓ Deleted', del.deletedCount, 'user(s)');

    // Create fresh admin with hashed password
    const hashed = await bcrypt.hash('Admin@1234', 10);
    await mongoose.connection.collection('users').insertOne({
      name:       'Admin',
      email:      'admin@polytime.in',
      password:   hashed,
      role:       'admin',
      department: 'Management',
      isActive:   true,
      createdAt:  new Date(),
      updatedAt:  new Date(),
    });

    console.log('\n✅ Admin user reset!');
    console.log('   Email   : admin@polytime.in');
    console.log('   Password: Admin@1234');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

reset();
