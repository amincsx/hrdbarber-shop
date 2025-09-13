// 🔧 PRODUCTION AUTHENTICATION FIX SCRIPT
// This script will help you debug and fix production authentication issues

import MongoDatabase from './src/lib/mongoDatabase.js';

async function fixProductionAuth() {
    console.log('🔧 PRODUCTION AUTHENTICATION FIX');
    console.log('=====================================\n');

    try {
        // Step 1: Test database connection
        console.log('1️⃣ Testing database connection...');
        console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ MISSING');
        
        if (!process.env.MONGODB_URI) {
            console.log('❌ CRITICAL: MONGODB_URI environment variable is missing!');
            console.log('📋 To fix this:');
            console.log('   1. Go to your Liara dashboard');
            console.log('   2. Navigate to Environment Variables');
            console.log('   3. Add: MONGODB_URI=your_mongodb_connection_string');
            console.log('   4. Redeploy your application');
            return;
        }

        // Test connection by getting barbers
        const barbers = await MongoDatabase.getAllBarbers();
        console.log('✅ Database connection successful');
        console.log(`📊 Found ${barbers.length} barbers in database`);

        // Step 2: Check existing users
        console.log('\n2️⃣ Checking existing users...');
        const testUsers = [
            { username: 'user', password: 'pass', name: 'Test User', role: 'customer' },
            { username: 'ceo', password: 'instad', name: 'CEO User', role: 'admin' },
            { username: '09123456789', password: 'testpass123', name: 'Test Signup User', role: 'user' }
        ];

        for (const userData of testUsers) {
            const existing = await MongoDatabase.findUserByPhone(userData.username);
            if (existing) {
                console.log(`✅ User '${userData.username}' exists`);
            } else {
                console.log(`❌ User '${userData.username}' missing - creating...`);
                try {
                    await MongoDatabase.addUser({
                        username: userData.username,
                        phone: userData.username,
                        password: userData.password,
                        name: userData.name,
                        role: userData.role,
                        isVerified: true
                    });
                    console.log(`✅ Created user '${userData.username}'`);
                } catch (error) {
                    console.log(`❌ Failed to create user '${userData.username}':`, error.message);
                }
            }
        }

        // Step 3: Test authentication
        console.log('\n3️⃣ Testing authentication...');
        for (const userData of testUsers) {
            const user = await MongoDatabase.findUserByPhone(userData.username);
            if (user && user.password === userData.password) {
                console.log(`✅ Auth test passed: ${userData.username}/${userData.password}`);
            } else {
                console.log(`❌ Auth test failed: ${userData.username}/${userData.password}`);
            }
        }

        // Step 4: Create barber accounts if needed
        console.log('\n4️⃣ Checking barber authentication accounts...');
        try {
            await MongoDatabase.initializeBarberAuth();
            console.log('✅ Barber authentication accounts verified');
        } catch (error) {
            console.log('❌ Error with barber accounts:', error.message);
        }

        console.log('\n🎉 PRODUCTION AUTHENTICATION FIX COMPLETE!');
        console.log('\n📋 Working credentials for testing:');
        testUsers.forEach(user => {
            console.log(`   ${user.username} / ${user.password}`);
        });

        console.log('\n🔧 If authentication still fails in production:');
        console.log('   1. Check Liara logs for specific error messages');
        console.log('   2. Verify MONGODB_URI is correctly set in Liara dashboard');
        console.log('   3. Test API endpoints directly: https://your-app.liara.run/api/auth?phone=user&password=pass');
        console.log('   4. Ensure MongoDB allows connections from Liara IP addresses');

    } catch (error) {
        console.error('\n❌ PRODUCTION AUTHENTICATION FIX FAILED!');
        console.error('Error:', error.message);
        
        console.log('\n🔧 Common fixes:');
        console.log('   1. Set MONGODB_URI environment variable in Liara dashboard');
        console.log('   2. Use correct MongoDB connection string (mongodb+srv://...)');
        console.log('   3. Ensure MongoDB network access allows your hosting platform');
        console.log('   4. Check MongoDB username/password are correct');
    }

    process.exit(0);
}

fixProductionAuth();
