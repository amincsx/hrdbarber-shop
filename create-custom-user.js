// create-custom-user.js
// A simple tool to directly create users in MongoDB
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Set up the User schema (similar to your app's model)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'user', 'barber', 'ceo'],
    default: 'user'
  },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

// Function to create a user
async function createUser(userData) {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected to MongoDB');

    // Register User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Create new user
    console.log('Creating user with data:');
    console.log(JSON.stringify(userData, null, 2));

    const user = new User(userData);
    const savedUser = await user.save();

    console.log('\n✅ User successfully created!');
    console.log('User ID:', savedUser._id);
    console.log('User data:', JSON.stringify(savedUser.toObject(), null, 2));

    return savedUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h') || args.length === 0;

if (showHelp) {
  console.log(`
Create Custom User Tool
------------------------
This tool helps you create users directly in MongoDB.

Usage:
  node create-custom-user.js --phone=09123456789 --name="User Name" --password=pass123 [options]

Required Parameters:
  --phone      Phone number (also used as username)
  --name       Full name
  --password   Password

Optional Parameters:
  --role       Role (user, admin, barber, ceo) [default: user]
  --verified   Whether the user is verified (true/false) [default: true]
  --help, -h   Show this help message

Examples:
  node create-custom-user.js --phone=09123456789 --name="Test User" --password=test123
  node create-custom-user.js --phone=09123456789 --name="Admin User" --password=admin123 --role=admin
  `);
  process.exit(0);
}

// Parse arguments
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const phone = getArg('phone');
const name = getArg('name');
const password = getArg('password');
const role = getArg('role') || 'user';
const isVerified = getArg('verified') !== 'false'; // Default to true

if (!phone || !name || !password) {
  console.error('Error: phone, name, and password are required.');
  console.log('Use --help for usage information');
  process.exit(1);
}

// Create the user
const userData = {
  username: phone,
  phone,
  password,
  name,
  role,
  isVerified
};

createUser(userData)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
