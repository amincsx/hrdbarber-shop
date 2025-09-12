require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Set up mongoose model directly to match your app's model
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

async function testDirectUserCreation() {
  console.log('🧪 Testing direct user creation bypassing Next.js API');
  console.log('---------------------------------------------');

  try {
    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('✅ Connected to MongoDB');

    // Register our model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Create test user data
    const uniquePhone = '0912' + Date.now().toString().slice(-7);
    const userData = {
      username: uniquePhone,
      phone: uniquePhone,
      password: 'testpassword123',
      name: 'Test Direct User',
      role: 'user',
      isVerified: true
    };

    console.log('\n2️⃣ Creating test user with data:');
    console.log(JSON.stringify(userData, null, 2));

    // Create and save the user
    const user = new User(userData);
    const savedUser = await user.save();

    console.log('\n✅ User successfully saved to MongoDB!');
    console.log('User ID:', savedUser._id);
    console.log('User data:', JSON.stringify(savedUser.toObject(), null, 2));

    // Verify user exists by looking it up
    console.log('\n3️⃣ Verifying user was saved by looking it up...');
    const foundUser = await User.findOne({ phone: uniquePhone });

    if (foundUser) {
      console.log('✅ User successfully retrieved from database!');

      // Clean up - delete test user
      await User.deleteOne({ _id: foundUser._id });
      console.log('\n🧹 Test user deleted for cleanup');

      console.log('\n🎉 SUCCESS: MongoDB user creation and retrieval is working correctly');
      console.log('This confirms your database models and connection are working properly');
      console.log('The issue is isolated to the HTTP API layer, not the database');
    } else {
      console.log('❌ User not found after saving! This indicates a database issue.');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n👋 MongoDB connection closed');
  }
}

// Run the test
testDirectUserCreation().catch(console.error);
