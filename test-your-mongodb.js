// 🧪 TEST YOUR SPECIFIC MONGODB CONNECTION
// This will test your exact MongoDB connection string

import mongoose from 'mongoose';

const YOUR_MONGODB_URI = 'mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@hrddatabase:27017/my-app?authSource=admin';

async function testYourMongoDB() {
    console.log('🧪 TESTING YOUR MONGODB CONNECTION');
    console.log('===================================\n');

    console.log('🔗 Connection String:');
    console.log('Host: hrddatabase:27017');
    console.log('Database: my-app');
    console.log('Auth Source: admin');
    console.log('Username: root');
    console.log('Password: [HIDDEN]');

    try {
        console.log('\n🔍 Attempting connection...');
        
        await mongoose.connect(YOUR_MONGODB_URI, {
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

        console.log('\n🎉 Your MongoDB connection is working perfectly!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to Liara Dashboard');
        console.log('2. Add this environment variable:');
        console.log('   MONGODB_URI=' + YOUR_MONGODB_URI);
        console.log('3. Redeploy your application');
        console.log('4. Test signup/login again');

    } catch (error) {
        console.log('❌ CONNECTION FAILED!');
        console.log('Error:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 ECONNREFUSED Solutions:');
            console.log('1. Check if MongoDB server is running');
            console.log('2. Verify host "hrddatabase" is accessible');
            console.log('3. Check if port 27017 is open');
            console.log('4. Ensure network access is allowed');
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

testYourMongoDB();
