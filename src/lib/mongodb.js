import mongoose from 'mongoose';

// Support multiple environment variable names for different hosting platforms
const MONGODB_URI = process.env.MONGODB_URI || 
                   process.env.DATABASE_URL || 
                   process.env.MONGODB_URL ||
                   'mongodb://localhost:27017/hrdbarber';

// Better error handling for production
if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/hrdbarber') {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ CRITICAL: MONGODB_URI not set in production environment!');
        console.error('Please set MONGODB_URI environment variable in your hosting platform.');
    }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4 // Use IPv4, skip trying IPv6
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('✅ MongoDB connected successfully');
            console.log('📍 Database:', mongoose.connection.db.databaseName);
            console.log('🌐 Host:', mongoose.connection.host);
            return mongoose;
        }).catch((error) => {
            console.error('❌ MongoDB connection failed:', error.message);
            console.error('🔧 Connection details:');
            console.error('   - URI length:', MONGODB_URI.length);
            console.error('   - URI starts with:', MONGODB_URI.substring(0, 20) + '...');
            console.error('   - Error type:', error.name);
            
            if (error.message.includes('ECONNREFUSED')) {
                console.error('🚨 ECONNREFUSED - Connection refused by server');
                console.error('   Solutions:');
                console.error('   1. Set MONGODB_URI in Liara dashboard');
                console.error('   2. Check MongoDB server is running');
                console.error('   3. Verify network access (allow 0.0.0.0/0 in Atlas)');
            } else if (error.message.includes('authentication failed')) {
                console.error('🚨 Authentication failed');
                console.error('   Solutions:');
                console.error('   1. Check username/password in connection string');
                console.error('   2. Verify database user permissions');
            }
            
            cached.promise = null; // Reset promise on error
            throw error;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB connection error:', e.message);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
