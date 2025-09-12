require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const http = require('http');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

// First connect to MongoDB directly
async function main() {
    console.log('🔍 Testing signup and database persistence');
    console.log('----------------------------------------');
    console.log('MongoDB URI:', MONGODB_URI);

    try {
        // Connect to MongoDB
        console.log('\n1️⃣ Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { bufferCommands: false });
        console.log('✅ Connected to MongoDB');

        // Generate a unique phone number
        const uniquePhone = '0912' + Date.now().toString().slice(-7);
        const testUser = {
            first_name: 'تست',
            last_name: 'کاربر',
            phone: uniquePhone,
            password: 'test123456',
            otp: '1234'
        };

        console.log('\n2️⃣ Test user data:');
        console.log(JSON.stringify(testUser, null, 2));

        // Count users before test
        const usersBefore = await mongoose.connection.db.collection('users').countDocuments();
        console.log(`\n3️⃣ Users in database before signup: ${usersBefore}`);

        // Make HTTP request to signup API
        console.log('\n4️⃣ Sending signup request...');
        await new Promise((resolve) => {
            // Create the request options
            const postData = JSON.stringify(testUser);
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/auth',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            // Function to handle API response
            const handleApiResponse = (apiResponse) => {
                let data = '';
                apiResponse.on('data', (chunk) => {
                    data += chunk;
                });

                apiResponse.on('end', () => {
                    console.log(`API Status Code: ${apiResponse.statusCode}`);
                    try {
                        const responseData = JSON.parse(data);
                        console.log('API Response:', JSON.stringify(responseData, null, 2));
                    } catch (e) {
                        console.log('Raw API Response:', data);
                    }
                    resolve();
                });
            };

            // Create and send the request
            try {
                const req = http.request(options, handleApiResponse);

                req.on('error', (e) => {
                    console.error(`❌ Request error: ${e.message}`);
                    console.log('Bypassing API test due to connection error...');
                    resolve();
                });

                req.on('timeout', () => {
                    console.error('❌ Request timed out');
                    req.destroy();
                    resolve();
                });

                req.write(postData);
                req.end();
            } catch (err) {
                console.error('Error making HTTP request:', err);
                resolve();
            }
        });

        // Directly check MongoDB to see if user was created regardless of API response
        console.log('\n5️⃣ Checking MongoDB directly for the new user...');

        // Wait a moment to ensure any async DB operations complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Count users after test
        const usersAfter = await mongoose.connection.db.collection('users').countDocuments();
        console.log(`Users in database after signup attempt: ${usersAfter}`);

        if (usersAfter > usersBefore) {
            console.log('✅ SUCCESS: New user was added to the database!');

            // Find the specific user we tried to create
            const foundUser = await mongoose.connection.db.collection('users').findOne({ phone: uniquePhone });

            if (foundUser) {
                console.log('\n🎉 Found our test user in the database:');
                console.log(JSON.stringify(foundUser, null, 2));

                // Clean up - delete test user
                await mongoose.connection.db.collection('users').deleteOne({ _id: foundUser._id });
                console.log('\n🧹 Test user deleted for cleanup');
            } else {
                console.log('\n❓ Strange: User count increased but we cannot find our test user');
            }
        } else {
            console.log('❌ PROBLEM: No new user was added to the database');

            // Try direct insert to check if database is writable
            console.log('\n6️⃣ Testing direct database insert...');
            const directTestUser = {
                username: uniquePhone,
                phone: uniquePhone,
                password: 'directtest123',
                name: 'Direct Test User',
                role: 'user',
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                const insertResult = await mongoose.connection.db.collection('users').insertOne(directTestUser);
                console.log(`✅ Direct insert successful, ID: ${insertResult.insertedId}`);

                // Clean up direct test user
                await mongoose.connection.db.collection('users').deleteOne({ _id: insertResult.insertedId });
                console.log('🧹 Direct test user deleted');

                console.log('\n🔍 DIAGNOSIS: The database is writable, but the API is not saving users.');
                console.log('This could be due to:');
                console.log('1. Error in the API implementation');
                console.log('2. Request not reaching the API');
                console.log('3. API validation failing silently');
            } catch (err) {
                console.error('❌ Direct insert failed:', err.message);
                console.log('\n🔍 DIAGNOSIS: The database is not writable. Check permissions and connection.');
            }
        }
    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\n👋 MongoDB connection closed');
    }
}

main().catch(console.error);
