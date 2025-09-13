// 🔍 MONGODB CONNECTION DIAGNOSTIC SCRIPT
// This will help identify the exact connection issue

import mongoose from 'mongoose';

async function diagnoseConnection() {
    console.log('🔍 MONGODB CONNECTION DIAGNOSTIC');
    console.log('================================\n');

    // Check environment variables
    console.log('1️⃣ Environment Variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET (length: ' + process.env.MONGODB_URI.length + ')' : 'NOT SET');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET');
    console.log('MONGODB_URL:', process.env.MONGODB_URL ? 'SET (length: ' + process.env.MONGODB_URL.length + ')' : 'NOT SET');

    // Determine which URI to use
    const uri = process.env.MONGODB_URI || 
                process.env.DATABASE_URL || 
                process.env.MONGODB_URL ||
                'mongodb://localhost:27017/hrdbarber';

    console.log('\n2️⃣ Using URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

    // Test connection
    console.log('\n3️⃣ Testing Connection...');
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });
        
        console.log('✅ Connection successful!');
        console.log('Database:', mongoose.connection.db.databaseName);
        console.log('Host:', mongoose.connection.host);
        console.log('Port:', mongoose.connection.port);
        
    } catch (error) {
        console.log('❌ Connection failed!');
        console.log('Error type:', error.name);
        console.log('Error message:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 ECONNREFUSED Solutions:');
            console.log('1. Check if MONGODB_URI is set in Liara dashboard');
            console.log('2. Verify MongoDB connection string is correct');
            console.log('3. Ensure MongoDB server is running and accessible');
            console.log('4. Check network access in MongoDB Atlas (allow all IPs: 0.0.0.0/0)');
        } else if (error.message.includes('authentication failed')) {
            console.log('\n🔧 Authentication Solutions:');
            console.log('1. Check username and password in connection string');
            console.log('2. Verify database user has correct permissions');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('\n🔧 DNS Solutions:');
            console.log('1. Check if MongoDB hostname is correct');
            console.log('2. Verify MongoDB cluster is active');
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

diagnoseConnection();
