import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017/hrdbarber');

async function checkOriginalDatabase() {
    try {
        await client.connect();
        console.log('✅ Connected to original hrdbarber database');

        const db = client.db();
        console.log('📍 Database name:', db.databaseName);

        const usersCollection = db.collection('users');
        const allUsers = await usersCollection.find({}).toArray();
        console.log('👥 Total users in hrdbarber:', allUsers.length);

        for (const user of allUsers) {
            console.log(`   - ${user.username} (${user.role}) - ${user.name}`);
        }

        const barbers = await usersCollection.find({ role: 'barber' }).toArray();
        console.log('💼 Total barbers in hrdbarber:', barbers.length);

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await client.close();
    }
}

checkOriginalDatabase();