// 🚀 Production Database Initialization
// This script ensures production database has all necessary data

import MongoDatabase from './mongoDatabase.js';

let isInitialized = false;

export async function initializeProductionDatabase() {
    if (isInitialized) {
        return;
    }

    console.log('🚀 Initializing Production Database...');
    
    try {
        // Test database connection
        const barbers = await MongoDatabase.getAllBarbers();
        console.log('✅ Database connection verified');

        // Create essential test users if they don't exist
        const testUsers = [
            { username: 'user', password: 'pass', name: 'Test User', role: 'customer' },
            { username: 'ceo', password: 'instad', name: 'CEO User', role: 'admin' },
            { username: '09123456789', password: 'testpass123', name: 'Test Signup User', role: 'user' }
        ];

        for (const userData of testUsers) {
            const existing = await MongoDatabase.findUserByPhone(userData.username);
            if (!existing) {
                try {
                    await MongoDatabase.addUser({
                        username: userData.username,
                        phone: userData.username,
                        password: userData.password,
                        name: userData.name,
                        role: userData.role,
                        isVerified: true
                    });
                    console.log(`✅ Created test user: ${userData.username}`);
                } catch (error) {
                    console.log(`⚠️ Could not create user ${userData.username}:`, error.message);
                }
            } else {
                console.log(`ℹ️ Test user already exists: ${userData.username}`);
            }
        }

        // Initialize barber authentication accounts
        try {
            await MongoDatabase.initializeBarberAuth();
            console.log('✅ Barber authentication accounts verified');
        } catch (error) {
            console.log('⚠️ Barber auth initialization failed:', error.message);
        }

        isInitialized = true;
        console.log('🎉 Production Database Initialization Complete!');

    } catch (error) {
        console.error('❌ Production Database Initialization Failed:', error.message);
        // Don't throw error - let the app continue running
    }
}

// Auto-initialize when this module is imported
if (process.env.NODE_ENV === 'production') {
    initializeProductionDatabase().catch(console.error);
}
