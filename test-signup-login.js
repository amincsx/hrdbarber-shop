// Test signup and login functionality
import MongoDatabase from './src/lib/mongoDatabase.js';

async function testSignupLogin() {
    console.log('🧪 Testing Signup and Login functionality...');
    
    try {
        // Test 1: Test existing user login
        console.log('\n1️⃣ Testing existing user login...');
        const existingUser = await MongoDatabase.findUserByPhone('user');
        if (existingUser && existingUser.password === 'pass') {
            console.log('✅ Existing user login test passed');
            console.log('   User:', existingUser.name, '| Role:', existingUser.role);
        } else {
            console.log('❌ Existing user login test failed');
        }
        
        // Test 2: Test creating a new user (signup simulation)
        console.log('\n2️⃣ Testing new user creation...');
        const testPhone = '09123456789';
        
        // Check if test user already exists
        const existingTestUser = await MongoDatabase.findUserByPhone(testPhone);
        if (existingTestUser) {
            console.log('ℹ️ Test user already exists, using existing user');
        } else {
            // Create new user
            try {
                const newUser = await MongoDatabase.addUser({
                    username: testPhone,
                    phone: testPhone,
                    password: 'testpass123',
                    name: 'Test Signup User',
                    role: 'user',
                    isVerified: true
                });
                console.log('✅ New user created successfully');
                console.log('   User ID:', newUser._id);
            } catch (createError) {
                console.log('❌ Error creating new user:', createError.message);
            }
        }
        
        // Test 3: Test login with the test user
        console.log('\n3️⃣ Testing login with test user...');
        const testUser = await MongoDatabase.findUserByPhone(testPhone);
        if (testUser && testUser.password === 'testpass123') {
            console.log('✅ Test user login successful');
            console.log('   User:', testUser.name, '| Phone:', testUser.phone);
        } else {
            console.log('❌ Test user login failed');
        }
        
        console.log('\n🎉 Signup/Login functionality test completed!');
        
    } catch (error) {
        console.error('❌ Error in signup/login test:', error);
    }
    
    process.exit(0);
}

testSignupLogin();
