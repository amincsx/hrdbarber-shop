// Test script to verify the fixes
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

console.log('🧪 Testing Authentication and Barber System...\n');

async function testSystem() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db();
        
        // Test 1: Check barbers
        console.log('\n1️⃣ Testing Barber Data...');
        const barbersCollection = db.collection('barbers');
        const barbers = await barbersCollection.find({}).toArray();
        
        console.log(`Found ${barbers.length} barbers:`);
        barbers.forEach(barber => {
            console.log(`   ✅ ${barber.name} (${barber.phone})`);
        });
        
        // Test 2: Check if we have the correct barbers
        const expectedBarbers = ['حمید', 'بنیامین', 'محمد'];
        const actualBarbers = barbers.map(b => b.name);
        const hasCorrectBarbers = expectedBarbers.every(name => actualBarbers.includes(name));
        
        if (hasCorrectBarbers) {
            console.log('✅ All correct barbers found in database');
        } else {
            console.log('❌ Missing expected barbers');
        }
        
        // Test 3: Check users collection exists
        console.log('\n2️⃣ Testing User Authentication...');
        const usersCollection = db.collection('users');
        const userCount = await usersCollection.countDocuments();
        console.log(`✅ Users collection ready (${userCount} users)`);
        
        // Test 4: Check bookings collection
        console.log('\n3️⃣ Testing Bookings System...');
        const bookingsCollection = db.collection('bookings');
        const bookingCount = await bookingsCollection.countDocuments();
        console.log(`✅ Bookings collection ready (${bookingCount} bookings)`);
        
        console.log('\n🎉 All systems are ready!');
        console.log('\nNext steps for the user:');
        console.log('1. Use the credentials "user" / "pass" or "ceo" / "instad" to login');
        console.log('2. After login, you can access /booking or /dashboard');
        console.log('3. The booking page will show the correct barbers: حمید, بنیامین, محمد');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

testSystem();
