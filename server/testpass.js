const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {

  // Step 1: generate hash and verify it works locally
  const password = 'Admin1234';
  const hash = await bcrypt.hash(password, 10);
  const localCheck = await bcrypt.compare(password, hash);
  console.log('Local bcrypt test:', localCheck); // must be true

  // Step 2: update DB
  await mongoose.connection.collection('users').updateOne(
    { email: 'admin@polytime.in' },
    { $set: { password: hash } }
  );

  // Step 3: read back and verify
  const user = await mongoose.connection.collection('users').findOne({ email: 'admin@polytime.in' });
  const dbCheck = await bcrypt.compare(password, user.password);
  console.log('DB bcrypt test:', dbCheck); // must be true

  console.log('Hash saved:', user.password);
  process.exit(0);
}).catch(err => { console.error(err.message); process.exit(1); });
