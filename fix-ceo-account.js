// Script to check and fix the CEO account
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
        const UserSchema = new mongoose.Schema({
            username: String,
            name: String,
            password: String,
            role: String,
            isVerified: Boolean
        });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Check if CEO account exists
        const ceoUser = await User.findOne({ role: 'admin' });

        if (ceoUser) {
            console.log('\nCurrent CEO/Admin account:');
            console.log(`Username: ${ceoUser.username}`);
            console.log(`Password: ${ceoUser.password}`);
            console.log(`Role: ${ceoUser.role}`);

            // Update CEO account password to match documentation
            console.log('\nUpdating CEO account password...');
            ceoUser.password = 'instad';
            await ceoUser.save();
            console.log('✅ CEO account password updated to "instad"');
        } else {
            console.log('\nNo CEO/Admin account found. Creating new account...');

            // Create CEO account
            const newCEO = new User({
                username: 'ceo',
                name: 'CEO User',
                password: 'instad',
                role: 'admin',
                isVerified: true
            });

            await newCEO.save();
            console.log('✅ Created new CEO account:');
            console.log('Username: ceo');
            console.log('Password: instad');
        }

    } catch (error) {
        console.error('❌ Error updating CEO account:', error);
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
