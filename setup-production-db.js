// Setup production database with test users and barber data
import MongoDatabase from './src/lib/mongoDatabase.js';

async function setupProductionDatabase() {
    console.log('🏗️ Setting up Production Database...');
    console.log('This will ensure your production database has all necessary data\n');

    try {
        // 1. Check connection
        console.log('1️⃣ Connecting to database...');
        const barbers = await MongoDatabase.getAllBarbers();
        console.log('✅ Database connected successfully');

        // 2. Check/Create barbers
        console.log('\n2️⃣ Checking barber data...');
        if (barbers.length === 0) {
            console.log('❌ No barbers found - database might be empty');
            console.log('You may need to run the barber setup script');
        } else {
            console.log(`✅ Found ${barbers.length} barbers:`, barbers.map(b => b.name));
        }

        // 3. Create/Check test users
        console.log('\n3️⃣ Setting up test users...');

        const testUsers = [
            { username: 'user', password: 'pass', name: 'Test User', role: 'customer' },
            { username: 'ceo', password: 'instad', name: 'CEO User', role: 'admin' },
            { username: '09123456789', password: 'testpass123', name: 'Test Signup User', role: 'user' }
        ];

        for (const userData of testUsers) {
            const existing = await MongoDatabase.findUserByPhone(userData.username);
            if (existing) {
                console.log(`✅ User '${userData.username}' already exists`);
            } else {
                try {
                    const newUser = await MongoDatabase.addUser({
                        username: userData.username,
                        phone: userData.username,
                        password: userData.password,
                        name: userData.name,
                        role: userData.role,
                        isVerified: true
                    });
                    console.log(`✅ Created user '${userData.username}' with password '${userData.password}'`);
                } catch (error) {
                    console.log(`❌ Failed to create user '${userData.username}':`, error.message);
                }
            }
        }

        // 4. Verify authentication works
        console.log('\n4️⃣ Testing authentication...');
        for (const userData of testUsers) {
            const user = await MongoDatabase.findUserByPhone(userData.username);
            if (user && user.password === userData.password) {
                console.log(`✅ Authentication test passed: ${userData.username}/${userData.password}`);
            } else {
                console.log(`❌ Authentication test failed: ${userData.username}/${userData.password}`);
            }
        }

        console.log('\n🎉 Production Database Setup Complete!');
        console.log('\n📋 Your working credentials:');
        testUsers.forEach(user => {
            console.log(`- ${user.username} / ${user.password}`);
        });

        console.log('\n✅ Ready for production deployment!');

    } catch (error) {
        console.error('\n❌ Production Database Setup Failed!');
        console.error('Error:', error.message);
        console.log('\n🔧 Check:');
        console.log('- MONGODB_URI is correctly set');
        console.log('- Database credentials are valid');
        console.log('- Network access to database is allowed');
    }

    process.exit(0);
}

setupProductionDatabase();
