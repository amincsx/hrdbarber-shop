require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

console.log('MongoDB Connection Test');
console.log('----------------------');
console.log('MongoDB URI:', MONGODB_URI);

async function testConnection() {
    console.log('\nAttempting to connect to MongoDB...');

    try {
        const connection = await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        });

        console.log('✅ MongoDB connected successfully!');

        // Check for collections in the database
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📋 Available collections:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });

        // Count documents in 'users' collection
        const usersCount = await mongoose.connection.db.collection('users').countDocuments();
        console.log(`\n👤 Users collection has ${usersCount} documents`);

        // Get a sample user to verify structure
        if (usersCount > 0) {
            const sampleUser = await mongoose.connection.db.collection('users').findOne({});
            console.log('\n📝 Sample user document:');
            console.log(JSON.stringify(sampleUser, null, 2));
        }

        // Test inserting a test user
        const testUser = {
            username: 'testuser_' + Date.now(),
            phone: '0912' + Date.now().toString().slice(-7),
            password: 'testpassword',
            name: 'Test User',
            role: 'user',
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log('\n🧪 Inserting test user into MongoDB...');
        const result = await mongoose.connection.db.collection('users').insertOne(testUser);

        if (result.acknowledged) {
            console.log(`✅ Test user inserted successfully with ID: ${result.insertedId}`);

            // Find the user we just inserted to verify it's there
            const insertedUser = await mongoose.connection.db.collection('users').findOne({ _id: result.insertedId });
            console.log('\n✅ Retrieved the user we just inserted:');
            console.log(JSON.stringify(insertedUser, null, 2));

            // Clean up - delete the test user
            await mongoose.connection.db.collection('users').deleteOne({ _id: result.insertedId });
            console.log('\n🧹 Test user deleted for cleanup');
        } else {
            console.log('❌ Failed to insert test user');
        }

    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('\n👋 MongoDB connection closed');
    }
}

testConnection().catch(console.error);
