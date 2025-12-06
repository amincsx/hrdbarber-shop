// Update barber with phone number
import MongoDatabase from './src/lib/mongoDatabase.js';

async function updateBarberPhone() {
    try {
        // Get the amin barber
        const user = await MongoDatabase.getUserByUsername('amin');

        if (!user) {
            console.log('❌ Barber amin not found');
            return;
        }

        console.log('📋 Found barber amin:', {
            username: user.username,
            name: user.name,
            role: user.role,
            phone: user.phone
        });

        // If phone is missing, add a phone number
        if (!user.phone) {
            console.log('📱 Adding phone number to barber amin...');

            // Update with a sample phone number
            await MongoDatabase.updateUser(user._id, {
                phone: '09353567227' // Using same as test user
            });

            console.log('✅ Phone number added to barber amin: 09353567227');
        } else {
            console.log('✅ Barber already has phone number:', user.phone);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

updateBarberPhone().then(() => {
    console.log('Done');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});