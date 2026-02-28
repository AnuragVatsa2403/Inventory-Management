

const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

const ADMIN = {
  name:       'Admin',
  email:      'admin@polytime.in',
  password:   'Admin@1234',
  role:       'admin',
  department: 'Management',
  isActive:   true,
};

const userSchema = new mongoose.Schema({
  name:       String,
  email:      { type: String, unique: true, lowercase: true },
  password:   String,
  role:       String,
  department: String,
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected');

    const existing = await User.findOne({ email: ADMIN.email });
    if (existing) {
      console.log('⚠  User already exists — skipping.');
      process.exit(0);
    }

    const hashed = await bcrypt.hash(ADMIN.password, 10);

    await User.create({ ...ADMIN, password: hashed });

    console.log('\n Admin user created!');
    console.log('   Email   :', ADMIN.email);
    console.log('   Password:', ADMIN.password);
    console.log('\n→ Now run: node index.js\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seed();
