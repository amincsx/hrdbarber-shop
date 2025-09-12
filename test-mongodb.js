// Test MongoDB connection and setup
import MongoDatabase from './src/lib/mongoDatabase.js';

console.log('🧪 Testing MongoDB Integration...\n');

async function testMongoDB() {
    try {
        console.log('1️⃣ Testing database connection...');

        // Test getting barbers
        console.log('2️⃣ Getting barbers from MongoDB...');
        const barbers = await MongoDatabase.getAllBarbers();
        console.log(`✅ Found ${barbers.length} barbers:`);
        barbers.forEach(barber => {
            console.log(`   - ${barber.name} (${barber.specialties?.join(', ')})`);
        });

        console.log('\n3️⃣ Testing barber authentication setup...');
        await MongoDatabase.initializeBarberAuth();

        console.log('\n4️⃣ Testing booking operations...');
        const bookings = await MongoDatabase.getAllBookings();
        console.log(`✅ Found ${bookings.length} existing bookings`);

        console.log('\n🎉 MongoDB integration test completed successfully!');

    } catch (error) {
        console.error('❌ MongoDB test failed:', error.message);
        console.error('Details:', error);
    }
}

testMongoDB();
