// Script to check romanized barber accounts
require('dotenv').config();
const mongoose = require('mongoose');

// Database connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

async function main() {
    console.log('Checking barber accounts with romanized usernames...');

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define models directly here
        const BarberSchema = new mongoose.Schema({
            name: String,
            phone: String,
            isActive: Boolean,
            username: String
        });

        const UserSchema = new mongoose.Schema({
            username: String,
            name: String,
            password: String,
            role: String,
            barber_id: mongoose.Schema.Types.ObjectId
        });

        const Barber = mongoose.models.Barber || mongoose.model('Barber', BarberSchema);
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Get all active barbers
        const barbers = await Barber.find({ isActive: true });
        console.log(`Found ${barbers.length} active barbers`);

        for (const barber of barbers) {
            console.log(`\nBarber: ${barber.name}`);
            console.log(`Phone: ${barber.phone}`);

            // Check if user account exists for this barber
            const barberUser = await User.findOne({
                barber_id: barber._id
            });

            if (barberUser) {
                console.log('✅ Authentication account exists:');
                console.log(`Username: ${barberUser.username}`);
                console.log(`Password: ${barberUser.password}`);
                console.log(`Role: ${barberUser.role}`);
            } else {
                console.log('❌ No authentication account found');
            }
        }

        // Also check for admin/CEO account
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            console.log('\n✅ Admin/CEO account exists:');
            console.log(`Username: ${adminUser.username}`);
            console.log(`Password: ${adminUser.password}`);
        } else {
            console.log('\n❌ No admin/CEO account found');
        }

    } catch (error) {
        console.error('❌ Error checking barber accounts:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Closed MongoDB connection');
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Unhandled error:', err);
        process.exit(1);
    });
