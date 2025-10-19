import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

console.log('🔧 Copying barbers from hrdbarber to hrdbarber-dev...');
console.log('Target MONGODB_URI:', process.env.MONGODB_URI);

const sourceClient = new MongoClient('mongodb://localhost:27017/hrdbarber');
const targetClient = new MongoClient(process.env.MONGODB_URI);

async function copyBarbers() {
    try {
        // Connect to both databases
        await sourceClient.connect();
        await targetClient.connect();

        console.log('✅ Connected to both databases');

        // Get barbers from source database
        const sourceDb = sourceClient.db();
        const sourceUsers = sourceDb.collection('users');
        const barbers = await sourceUsers.find({ role: 'barber' }).toArray();

        console.log(`📋 Found ${barbers.length} barbers in source database`);

        // Get target database
        const targetDb = targetClient.db();
        const targetUsers = targetDb.collection('users');

        console.log('📍 Target database:', targetDb.databaseName);

        // Clear existing users in target database first
        const deleteResult = await targetUsers.deleteMany({});
        console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing users from target`);

        // Copy each barber with fresh password hash
        for (const barber of barbers) {
            const defaultPassword = `${barber.username}1234`;
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            const newBarber = {
                username: barber.username,
                password: hashedPassword,
                name: barber.name,
                role: 'barber',
                phone: barber.phone || null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await targetUsers.insertOne(newBarber);
            console.log(`✅ Created ${barber.username} (${barber.name}) with password ${defaultPassword}`);
        }

        // Verify the copy
        console.log('\n🔍 Verifying copy...');
        const targetBarbers = await targetUsers.find({ role: 'barber' }).toArray();
        console.log(`📊 Target database now has ${targetBarbers.length} barbers`);

        for (const barber of targetBarbers) {
            console.log(`   ✂️ ${barber.username} - ${barber.name}`);
        }

        // Test login for hamid
        console.log('\n🔐 Testing login for hamid...');
        const hamidUser = await targetUsers.findOne({ username: 'hamid' });
        if (hamidUser) {
            const passwordMatch = await bcrypt.compare('hamid1234', hamidUser.password);
            console.log(`   ✅ Hamid found: ${hamidUser.name}`);
            console.log(`   🔐 Password test: ${passwordMatch ? 'PASS' : 'FAIL'}`);
        } else {
            console.log('   ❌ Hamid not found');
        }

        console.log('\n✅ Database copy completed successfully!');
        console.log('📋 You can now login at: http://localhost:3000/barber-login');
        console.log('   - hamid / hamid1234');
        console.log('   - benyamin / benyamin1234');
        console.log('   - mohammad / mohammad1234');

    } catch (error) {
        console.error('❌ Copy error:', error);
    } finally {
        await sourceClient.close();
        await targetClient.close();
    }
}

copyBarbers();