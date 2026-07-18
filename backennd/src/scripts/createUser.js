const readline = require('readline');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const { ROLES_ARRAY } = require('../constants');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const createUser = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB\n');

    const name = await ask('Name: ');
    const email = await ask('Email: ');
    const password = await ask('Password: ');
    const role = await ask(`Role (${ROLES_ARRAY.join(', ')}): `);

    if (!name || !email || !password) {
      console.error('Name, email, and password are required');
      process.exit(1);
    }

    if (!ROLES_ARRAY.includes(role)) {
      console.error(`Invalid role. Must be one of: ${ROLES_ARRAY.join(', ')}`);
      process.exit(1);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.error(`Error: User with email "${email}" already exists`);
      process.exit(1);
    }

    const user = await User.create({ name, email, password, role });
    console.log(`\nUser created successfully:`);
    console.log(`  Name:  ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role:  ${user.role}`);
  } catch (error) {
    console.error('Error creating user:', error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
};

createUser();
