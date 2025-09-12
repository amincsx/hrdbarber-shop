// Script to create accounts (CommonJS version)
require('dotenv').config();
const mongoose = require('mongoose');

// Database connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

async function main() {
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
            barber_id: mongoose.Schema.Types.ObjectId,
            isVerified: Boolean
        });

        const Barber = mongoose.models.Barber || mongoose.model('Barber', BarberSchema);
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Create barber accounts
        const barbers = await Barber.find({ isActive: true });
        console.log(`Found ${barbers.length} active barbers`);

        for (const barber of barbers) {
            // Check if user account already exists
            const existingUser = await User.findOne({
                $or: [
                    { barber_id: barber._id }
                ]
            });

            if (!existingUser) {
                // Use barber's name as username
                let username = barber.name;

                // Create user account for barber
                const userData = {
                    username: username,
                    name: barber.name,
                    password: `${username}123`, // Name + 123 as password
                    role: 'barber',
                    barber_id: barber._id,
                    isVerified: true
                };

                const newUser = new User(userData);
                await newUser.save();
                console.log(`✅ Created auth account for barber: ${barber.name} (${username})`);
            } else {
                console.log(`ℹ️ Auth account already exists for: ${barber.name}`);
            }
        }

        // Create CEO account if it doesn't exist
        const existingCEO = await User.findOne({ role: 'admin' });
        if (!existingCEO) {
            const ceoUser = new User({
                username: 'ceo',
                name: 'CEO User',
                password: 'ceo123',
                role: 'admin',
                isVerified: true
            });

            await ceoUser.save();
            console.log('✅ Created CEO account: username = ceo, password = ceo123');
        } else {
            console.log('ℹ️ CEO account already exists');
        }

    } catch (error) {
        console.error('❌ Error creating accounts:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Closed MongoDB connection');
    }
}

main()
    .then(() => console.log('✅ Script completed successfully'))
    .catch(err => {
        console.error('❌ Unhandled error:', err);
        process.exit(1);
    });
