import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables from .env.local
console.log('[dotenv@17.2.3] injecting env from .env.local');
dotenv.config({ path: '.env.local' });

console.log('🔧 Debugging database connection...');
console.log('Using MONGODB_URI:', process.env.MONGODB_URI);

const client = new MongoClient(process.env.MONGODB_URI);

async function debugDatabase() {
    try {
        await client.connect();
        console.log('✅ MongoDB connected successfully');

        const db = client.db();
        console.log('📍 Database name:', db.databaseName);

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('📦 Collections:', collections.map(c => c.name));

        // Check users collection
        const usersCollection = db.collection('users');
        const allUsers = await usersCollection.find({}).toArray();
        console.log('👥 Total users:', allUsers.length);

        for (const user of allUsers) {
            console.log(`   - ${user.username} (${user.role}) - ${user.name}`);
        }

        // Check specifically for barbers
        const barbers = await usersCollection.find({ role: 'barber' }).toArray();
        console.log('💼 Total barbers:', barbers.length);

        for (const barber of barbers) {
            console.log(`   ✂️ ${barber.username} - ${barber.name} (ID: ${barber._id})`);
        }

        // Test specific user lookup
        console.log('\n🔍 Testing user lookup for hamid...');
        const hamidUser = await usersCollection.findOne({ username: 'hamid' });
        console.log('Found hamid:', hamidUser ? 'YES' : 'NO');
        if (hamidUser) {
            console.log('   Details:', {
                username: hamidUser.username,
                name: hamidUser.name,
                role: hamidUser.role,
                hasPassword: !!hamidUser.password
            });
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await client.close();
    }
}

debugDatabase();