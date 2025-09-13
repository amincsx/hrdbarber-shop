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
            return mongoose;
        }).catch((error) => {
            console.error('❌ MongoDB connection failed:', error.message);
            console.error('🔧 Check your MONGODB_URI environment variable');
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
