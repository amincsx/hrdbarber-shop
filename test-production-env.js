// Test production environment locally without deploying
import MongoDatabase from './src/lib/mongoDatabase.js';

async function testProductionEnvironment() {
    console.log('🌐 Testing Production Environment Locally...');
    console.log('📍 This simulates your Liara deployment environment\n');

    try {
        // Check environment variables
        console.log('1️⃣ Checking Environment Variables...');
        console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
        console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ MISSING');

        if (!process.env.MONGODB_URI) {
            console.log('🚨 CRITICAL: MONGODB_URI is missing!');
            console.log('This is likely why production fails but local works.');
            console.log('Solution: Add MONGODB_URI to your Liara environment variables');
            return;
        }

        // Test database connection
        console.log('\n2️⃣ Testing Database Connection...');
        const barbers = await MongoDatabase.getAllBarbers();
        console.log('✅ Database connection successful');
        console.log(`✅ Found ${barbers.length} barbers:`, barbers.map(b => b.name));

        // Test user authentication data
        console.log('\n3️⃣ Testing Authentication Data...');
        const testUsers = ['user', 'ceo'];
        for (const username of testUsers) {
            const user = await MongoDatabase.findUserByPhone(username);
            if (user) {
                console.log(`✅ User '${username}' exists with password '${user.password}'`);
            } else {
                console.log(`❌ User '${username}' NOT FOUND in production database`);
                console.log(`Solution: Run create-test-users.js against production database`);
            }
        }

        // Check if this is production database or local
        console.log('\n4️⃣ Database Environment Check...');
        if (process.env.MONGODB_URI.includes('localhost')) {
            console.log('📍 Using LOCAL database');
            console.log('⚠️  Production might use different database');
        } else {
            console.log('📍 Using REMOTE/PRODUCTION database');
            console.log('✅ This matches production environment');
        }

        console.log('\n🎉 Production Environment Test Complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. Set MONGODB_URI in Liara environment variables');
        console.log('2. Ensure production database has test users');
        console.log('3. Deploy with confidence!');

    } catch (error) {
        console.error('\n❌ Production Environment Test Failed!');
        console.error('Error:', error.message);
        console.log('\n🔧 Common Solutions:');
        console.log('- Check MONGODB_URI format');
        console.log('- Verify database credentials');
        console.log('- Ensure network access to database');
        console.log('- Check firewall/IP whitelist settings');
    }

    process.exit(0);
}

testProductionEnvironment();
