// Add phone numbers to all barbers
import MongoDatabase from './src/lib/mongoDatabase.js';

async function addPhonesToBarbers() {
    try {
        // Phone numbers for each barber
        const barberPhones = {
            'hamid': '09191234567',
            'benyamin': '09192345678',
            'mohammad': '09193456789'
        };

        for (const [username, phone] of Object.entries(barberPhones)) {
            const user = await MongoDatabase.getUserByUsername(username);

            if (!user) {
                console.log(`❌ Barber ${username} not found`);
                continue;
            }

            console.log(`\n🔄 Updating ${username}...`);
            console.log(`   Current phone: ${user.phone || 'NOT SET'}`);

            // Update with phone number
            await MongoDatabase.updateUser(user._id, { phone });

            console.log(`   ✅ Phone updated to: ${phone}`);
        }

        console.log('\n✅ All barbers updated with phone numbers!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

addPhonesToBarbers().then(() => {
    console.log('\nDone');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});