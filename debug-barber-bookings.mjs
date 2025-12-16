import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'my-app';

async function debugBarberData() {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();

        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');
        const barbersCollection = db.collection('barbers');
        const bookingsCollection = db.collection('bookings');

        console.log('\n=== 🔍 BARBER DEBUG INFO ===\n');

        // Get all barbers
        const allBarbers = await barbersCollection.find({}).toArray();
        console.log('📊 All Barbers in Database:', allBarbers.length);
        allBarbers.forEach((barber, index) => {
            console.log(`  ${index + 1}. Name: ${barber.name}, Phone: ${barber.phone}, ID: ${barber._id}`);
        });

        // Get all users with type 'barber'
        console.log('\n📋 All Users (barber type):');
        const barberUsers = await usersCollection.find({ type: 'barber' }).toArray();
        barberUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. Username: ${user.username}, Name: ${user.name}, ID: ${user._id}`);
        });

        // Count all bookings
        const allBookings = await bookingsCollection.find({}).toArray();
        console.log(`\n📅 Total Bookings: ${allBookings.length}`);

        // Show sample bookings with their barber field
        if (allBookings.length > 0) {
            console.log('\n📌 Sample Bookings (first 10):');
            allBookings.slice(0, 10).forEach((booking, index) => {
                console.log(`  ${index + 1}. Barber: "${booking.barber}", Status: ${booking.status}, Date: ${booking.date_key}, User: ${booking.user_name}`);
            });
        }

        // For each barber, show how many bookings they have
        console.log('\n🔗 Bookings per Barber:');
        for (const barber of allBarbers) {
            const count = await bookingsCollection.countDocuments({ barber: barber.name });
            console.log(`  "${barber.name}": ${count} bookings`);
        }

        console.log('\n✅ Debug complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

debugBarberData();
