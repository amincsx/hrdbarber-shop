import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

console.log('🔧 Creating barbers in production database...');
console.log('Using MONGODB_URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

const client = new MongoClient(process.env.MONGODB_URI);

async function createBarbersInProduction() {
    try {
        await client.connect();
        console.log('✅ MongoDB connected successfully to production');

        const db = client.db();
        console.log('📍 Database name:', db.databaseName);

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('📦 Collections:', collections.map(c => c.name));

        const usersCollection = db.collection('users');

        // Check existing users
        const allUsers = await usersCollection.find({}).toArray();
        console.log('👥 Total existing users:', allUsers.length);

        for (const user of allUsers) {
            console.log(`   - ${user.username || user.phone || 'unknown'} (${user.role || 'no-role'}) - ${user.name || 'no-name'}`);
        }

        // Define the 3 default barbers
        const defaultBarbers = [
            { username: 'hamid', password: 'hamid1234', name: 'حمید' },
            { username: 'benyamin', password: 'benyamin1234', name: 'بنیامین' },
            { username: 'mohammad', password: 'mohammad1234', name: 'محمد' }
        ];

        console.log('\n🔧 Creating/updating default barbers...');

        for (const barberData of defaultBarbers) {
            // Check if barber already exists
            const existingBarber = await usersCollection.findOne({ username: barberData.username });

            const hashedPassword = await bcrypt.hash(barberData.password, 10);

            if (existingBarber) {
                // Update existing barber
                const updateResult = await usersCollection.updateOne(
                    { username: barberData.username },
                    {
                        $set: {
                            password: hashedPassword,
                            name: barberData.name,
                            role: 'barber',
                            updatedAt: new Date()
                        }
                    }
                );
                console.log(`   ✅ Updated ${barberData.username} (${barberData.name})`);
            } else {
                // Create new barber
                const newBarber = {
                    username: barberData.username,
                    password: hashedPassword,
                    name: barberData.name,
                    role: 'barber',
                    phone: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const insertResult = await usersCollection.insertOne(newBarber);
                console.log(`   ✅ Created ${barberData.username} (${barberData.name}) - ID: ${insertResult.insertedId}`);
            }
        }

        // Verify the barbers were created
        console.log('\n🔍 Verifying barbers...');
        const barbers = await usersCollection.find({ role: 'barber' }).toArray();
        console.log(`📊 Total barbers in production: ${barbers.length}`);

        for (const barber of barbers) {
            console.log(`   ✂️ ${barber.username} - ${barber.name} (ID: ${barber._id})`);
        }

        // Test login for hamid
        console.log('\n🔐 Testing login for hamid...');
        const hamidUser = await usersCollection.findOne({ username: 'hamid' });
        if (hamidUser) {
            const passwordMatch = await bcrypt.compare('hamid1234', hamidUser.password);
            console.log(`   ✅ Hamid found: ${hamidUser.name}`);
            console.log(`   🔐 Password test: ${passwordMatch ? 'PASS' : 'FAIL'}`);
        } else {
            console.log('   ❌ Hamid not found');
        }

        console.log('\n✅ Production database setup completed successfully!');
        console.log('📋 You can now login at your production URL with:');
        console.log('   - hamid / hamid1234');
        console.log('   - benyamin / benyamin1234');
        console.log('   - mohammad / mohammad1234');

        console.log('\n🔗 MongoDB Compass Connection:');
        console.log('   Use this connection string in MongoDB Compass:');
        console.log('   mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@table-mountain.liara.cloud:34674/my-app?authSource=admin');

    } catch (error) {
        console.error('❌ Production database error:', error);
    } finally {
        await client.close();
    }
}

createBarbersInProduction();