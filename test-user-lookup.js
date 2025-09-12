import MongoDatabase from './src/lib/mongoDatabase.js';

async function testUserLookup() {
    console.log('🔍 Testing user lookup...');

    try {
        // Test finding user by phone (which maps to username)
        const user1 = await MongoDatabase.findUserByPhone('user');
        console.log('findUserByPhone("user"):', user1);

        const user2 = await MongoDatabase.findUserByPhone('ceo');
        console.log('findUserByPhone("ceo"):', user2);

        // Test direct username lookup
        const user3 = await MongoDatabase.getUserByUsername('user');
        console.log('getUserByUsername("user"):', user3);

        const user4 = await MongoDatabase.getUserByUsername('ceo');
        console.log('getUserByUsername("ceo"):', user4);

    } catch (error) {
        console.error('Error:', error);
    }

    process.exit(0);
}

testUserLookup();
