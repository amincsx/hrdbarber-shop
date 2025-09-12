// Script to check barber accounts and credentials
import MongoDatabase from './src/lib/mongoDatabase.js';
import { Barber, User } from './src/lib/models.js';
import dbConnect from './src/lib/mongodb.js';

async function main() {
    console.log('Checking barber accounts and credentials...');

    try {
        await dbConnect();

        // Get all active barbers
        const barbers = await Barber.find({ isActive: true });
        console.log(`Found ${barbers.length} active barbers`);

        for (const barber of barbers) {
            console.log(`\nBarber: ${barber.name}`);
            console.log(`Phone: ${barber.phone}`);

            // Check if user account exists for this barber
            const barberUser = await User.findOne({
                $or: [
                    { username: barber.phone },
                    { barber_id: barber._id }
                ]
            });

            if (barberUser) {
                console.log('✅ Authentication account exists:');
                console.log(`Username: ${barberUser.username}`);
                console.log(`Password: ${barberUser.password}`);
                console.log(`Role: ${barberUser.role}`);
            } else {
                console.log('❌ No authentication account found');

                // Generate what the username would be
                let username = barber.username;
                if (!username) {
                    username = barber.name
                        .replace(/\s+/g, '')
                        .toLowerCase()
                        .replace(/[^\w]/g, '');
                }

                console.log(`Expected username would be: ${username}`);
                console.log(`Expected password would be: ${username}123`);
            }
        }

    } catch (error) {
        console.error('❌ Error checking barber accounts:', error);
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Unhandled error:', err);
        process.exit(1);
    });
