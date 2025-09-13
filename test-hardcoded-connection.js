// 🧪 TEST HARDCODED MONGODB CONNECTION
// This tests the exact connection string we're using in production

import mongoose from 'mongoose';

const HARDCODED_URI = 'mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@hrddatabase:27017/my-app?authSource=admin';

async function testHardcodedConnection() {
    console.log('🧪 TESTING HARDCODED MONGODB CONNECTION');
    console.log('========================================\n');

    console.log('🔗 Connection String:');
    console.log('Host: hrddatabase:27017');
    console.log('Database: my-app');
    console.log('Auth Source: admin');
    console.log('Username: root');

    try {
        console.log('\n🔍 Attempting connection...');
        
        await mongoose.connect(HARDCODED_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        });

        console.log('✅ CONNECTION SUCCESSFUL!');
        console.log('Database:', mongoose.connection.db.databaseName);
        console.log('Host:', mongoose.connection.host);
        console.log('Port:', mongoose.connection.port);
        
        // Test basic operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        console.log('\n🎉 Hardcoded MongoDB connection is working!');
        console.log('This means your production deployment should work now.');

    } catch (error) {
        console.log('❌ CONNECTION FAILED!');
        console.log('Error:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 ECONNREFUSED Solutions:');
            console.log('1. Check if MongoDB server is running');
            console.log('2. Verify host "hrddatabase" is accessible from Liara');
            console.log('3. Check if port 27017 is open');
        } else if (error.message.includes('authentication failed')) {
            console.log('\n🔧 Authentication Solutions:');
            console.log('1. Check username "root" is correct');
            console.log('2. Verify password is correct');
            console.log('3. Ensure user has access to "my-app" database');
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testHardcodedConnection();
