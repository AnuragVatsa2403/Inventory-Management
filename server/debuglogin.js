const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const email    = 'admin@polytime.in';
  const password = 'Admin1234';

  const user = await mongoose.connection.collection('users').findOne({ email });
  console.log('User found:', !!user);
  console.log('Email in DB:', user?.email);
  console.log('Password entered:', password);
  console.log('Hash in DB:', user?.password);

  const match = await bcrypt.compare(password, user.password);
  console.log('bcrypt.compare result:', match);

  process.exit(0);
}).catch(err => { console.error(err.message); process.exit(1); });
