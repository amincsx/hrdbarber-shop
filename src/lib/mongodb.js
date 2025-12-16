import mongoose from 'mongoose';

// Support multiple environment variable names for different hosting platforms
const MONGODB_URI = process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URL ||
    'mongodb://localhost:27017/hrdbarber';

// Debug environment variables in production
if (process.env.NODE_ENV === 'production') {
    console.log('🔍 PRODUCTION ENVIRONMENT DEBUG:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI set:', !!process.env.MONGODB_URI);
    console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.log('MONGODB_URL set:', !!process.env.MONGODB_URL);
    console.log('Using URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

    if (!process.env.MONGODB_URI && !process.env.DATABASE_URL && !process.env.MONGODB_URL) {
        console.error('❌ CRITICAL: No MongoDB environment variables found!');
        console.error('🔧 To fix this, set one of these environment variables:');
        console.error('   MONGODB_URI=mongodb://username:password@host:port/database');
        console.error('   DATABASE_URL=mongodb://username:password@host:port/database');
        console.error('   MONGODB_URL=mongodb://username:password@host:port/database');
        console.error('🚨 Using localhost fallback - this will NOT work in production!');
    } else {
        console.log('✅ Using environment variable MongoDB URI');
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
            serverSelectionTimeoutMS: 8000, // Keep trying to send operations for 8 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4, // Use IPv4, skip trying IPv6
            retryWrites: true,
            retryReads: true,
            // Connection pool settings for Liara
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            waitQueueTimeoutMS: 8000,
            // Heartbeat settings
            heartbeatFrequencyMS: 10000,
            // Error handling
            connectTimeoutMS: 8000
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('✅ MongoDB connected successfully');
            console.log('📍 Database:', mongoose.connection.db.databaseName);
            console.log('🌐 Host:', mongoose.connection.host);

            // Add connection monitoring
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB runtime error:', err.message);
                if (err.message.includes('connection') || err.message.includes('timeout')) {
                    cached.conn = null;
                    cached.promise = null;
                }
            });

            mongoose.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
                cached.conn = null;
                cached.promise = null;
            });

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
