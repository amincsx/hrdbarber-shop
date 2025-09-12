// Script to initialize barber authentication accounts
import MongoDatabase from './src/lib/mongoDatabase.js';

async function main() {
    console.log('Starting barber initialization...');

    try {
        // Initialize barber authentication accounts
        await MongoDatabase.initializeBarberAuth();
        console.log('✅ Barber initialization completed successfully');
    } catch (error) {
        console.error('❌ Error initializing barbers:', error);
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Unhandled error:', err);
        process.exit(1);
    });
