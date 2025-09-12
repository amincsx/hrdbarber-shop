// Script to update barber accounts to use romanized/English usernames
require('dotenv').config();
const mongoose = require('mongoose');

// Database connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

// Map of Farsi names to romanized/English names
const nameMap = {
    'حمید': 'hamid',
    'بنیامین': 'benyamin',
    'محمد': 'mohammad'
};

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

        // Get all active barbers
        const barbers = await Barber.find({ isActive: true });
        console.log(`Found ${barbers.length} active barbers`);

        for (const barber of barbers) {
            console.log(`\nProcessing barber: ${barber.name}`);

            // Get the romanized name
            const romanizedName = nameMap[barber.name] || barber.name.toLowerCase();

            // Find the corresponding user account
            const barberUser = await User.findOne({
                $or: [
                    { barber_id: barber._id }
                ]
            });

            if (barberUser) {
                console.log(`✅ Found existing account: ${barberUser.username}`);

                // Update to use the romanized name-based authentication
                barberUser.username = romanizedName;
                barberUser.password = `${romanizedName}123`;

                await barberUser.save();
                console.log(`✅ Updated account to use romanized name-based authentication:`);
                console.log(`   Username: ${barberUser.username}`);
                console.log(`   Password: ${barberUser.password}`);
            } else {
                console.log(`❌ No authentication account found for ${barber.name}`);

                // Create new user account
                const newUser = new User({
                    username: romanizedName,
                    name: barber.name,
                    password: `${romanizedName}123`,
                    role: 'barber',
                    barber_id: barber._id,
                    isVerified: true
                });

                await newUser.save();
                console.log(`✅ Created new account for ${barber.name} with username ${romanizedName}`);
            }
        }

        // Update CEO account if desired
        const ceoUser = await User.findOne({ role: 'admin' });
        if (ceoUser && ceoUser.username === 'ceo') {
            console.log('\nKeeping CEO account as is');
        }

    } catch (error) {
        console.error('❌ Error updating accounts:', error);
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
