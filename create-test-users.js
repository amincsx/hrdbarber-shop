// Script to create test users in MongoDB
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

async function createTestUsers() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const usersCollection = db.collection('users');

        // Check if users already exist
        const existingUserCount = await usersCollection.countDocuments();
        console.log(`Current users in database: ${existingUserCount}`);

        // Create test users
        const testUsers = [
            {
                username: 'user', // Using username instead of phone
                name: 'Test User',
                password: 'pass', // In production, this should be hashed
                role: 'customer',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                username: 'ceo', // Using username instead of phone
                name: 'CEO User',
                password: 'instad', // In production, this should be hashed
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Insert users if they don't exist
        for (const user of testUsers) {
            const existingUser = await usersCollection.findOne({ username: user.username });
            if (!existingUser) {
                await usersCollection.insertOne(user);
                console.log(`✅ Created user: ${user.username} (${user.name})`);
            } else {
                console.log(`ℹ️ User already exists: ${user.username}`);
            }
        }

        // Verify users
        const allUsers = await usersCollection.find({}).toArray();
        console.log('\nCurrent users in database:');
        allUsers.forEach(user => {
            console.log(`- Username: ${user.username}, Name: ${user.name}, Role: ${user.role}`);
        });

        console.log('\n🎉 Test users are ready!');
        console.log('You can now login with:');
        console.log('1. Username: "user", Password: "pass"');
        console.log('2. Username: "ceo", Password: "instad"');

    } catch (error) {
        console.error('Error creating test users:', error);
    } finally {
        await client.close();
    }
}

createTestUsers();
