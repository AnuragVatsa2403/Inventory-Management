const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected');

    // Delete existing admin
    await User.deleteMany({ email: 'admin@polytime.in' });
    console.log('✓ Cleared old admin');

    // Create using User model — pre-save hook will hash password automatically
    const user = new User({
      name:       'Admin',
      email:      'admin@polytime.in',
      password:   'Admin1234',
      role:       'admin',
      department: 'Management',
      isActive:   true,
    });
    await user.save();
    console.log('✓ Admin created with hashed password');

    // Verify it works
    const saved = await User.findOne({ email: 'admin@polytime.in' }).select('+password');
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare('Admin1234', saved.password);
    console.log('✓ Password verify:', match);

    console.log('\n✅ Done!');
    console.log('   Email   : admin@polytime.in');
    console.log('   Password: Admin1234');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
