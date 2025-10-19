import dotenv from 'dotenv';
// Load environment variables first
dotenv.config({ path: '.env.local' });

import MongoDatabase from './src/lib/mongoDatabase.js';
import bcrypt from 'bcryptjs';

async function createBarbersInDevDatabase() {
    console.log('🔧 Creating barbers in hrdbarber-dev database...');
    console.log('Using MONGODB_URI:', process.env.MONGODB_URI);

    try {
        const defaultBarbers = [
            {
                username: 'hamid',
                name: 'حمید',
                password: 'hamid1234',
                role: 'barber',
                phone: '09123456001',
                isVerified: true
            },
            {
                username: 'benyamin',
                name: 'بنیامین',
                password: 'benyamin1234',
                role: 'barber',
                phone: '09123456002',
                isVerified: true
            },
            {
                username: 'mohammad',
                name: 'محمد',
                password: 'mohammad1234',
                role: 'barber',
                phone: '09123456003',
                isVerified: true
            }
        ];

        for (const barberData of defaultBarbers) {
            try {
                // Check if barber already exists
                const existingUser = await MongoDatabase.getUserByUsername(barberData.username);

                if (existingUser) {
                    console.log(`   ✅ Barber ${barberData.username} already exists`);

                    // Update password to make sure it's correct
                    const hashedPassword = await bcrypt.hash(barberData.password, 10);
                    await MongoDatabase.updateUser(existingUser._id, {
                        password: hashedPassword,
                        isVerified: true
                    });
                    console.log(`   🔐 Updated ${barberData.username} password`);
                } else {
                    // Hash password and create user
                    const hashedPassword = await bcrypt.hash(barberData.password, 10);
                    const userData = {
                        ...barberData,
                        password: hashedPassword
                    };

                    const newUser = await MongoDatabase.addUser(userData);
                    console.log(`   ✅ Created barber: ${barberData.username} (${barberData.name})`);
                }
            } catch (error) {
                console.error(`   ❌ Error with barber ${barberData.username}:`, error.message);
            }
        }

        // Test login for hamid
        console.log('\n🔐 Testing login for hamid...');
        const user = await MongoDatabase.getUserByUsername('hamid');
        if (user) {
            const passwordMatch = await bcrypt.compare('hamid1234', user.password);
            console.log(`   ✅ Hamid found: ${user.name} (${user.username})`);
            console.log(`   🔐 Password test: ${passwordMatch ? 'PASS' : 'FAIL'}`);
        } else {
            console.log('   ❌ Hamid not found');
        }

        console.log('\n✅ Database setup completed successfully!');
        console.log('📋 You can now login at: http://localhost:3000/barber-login');
        console.log('   - hamid / hamid1234');
        console.log('   - benyamin / benyamin1234');
        console.log('   - mohammad / mohammad1234');

        process.exit(0);

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

createBarbersInDevDatabase();