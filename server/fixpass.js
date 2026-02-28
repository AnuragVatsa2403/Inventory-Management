const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash('Admin1234', 10);
  await mongoose.connection.collection('users').updateOne(
    { email: 'admin@polytime.in' },
    { $set: { password: hash } }
  );
  console.log('✓ Password updated');
  console.log('  Email   : admin@polytime.in');
  console.log('  Password: Admin1234');
  process.exit(0);
}).catch(err => { console.error(err.message); process.exit(1); });
