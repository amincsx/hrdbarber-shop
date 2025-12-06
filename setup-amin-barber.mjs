import MongoDatabase from './src/lib/mongoDatabase.js';

(async () => {
    try {
        console.log('🔄 Cleaning up existing barbers...');

        // Delete hamid, benyamin, mohammad
        await MongoDatabase.deleteUser('hamid');
        console.log('✅ Deleted hamid');

        await MongoDatabase.deleteUser('benyamin');
        console.log('✅ Deleted benyamin');

        await MongoDatabase.deleteUser('mohammad');
        console.log('✅ Deleted mohammad');

        console.log('\n🔄 Creating amin barber...');

        // Create amin as barber with phone number
        const amin = await MongoDatabase.createUser({
            username: 'amin',
            name: 'امین',
            phone: '09191234567',
            password: 'amin123',
            role: 'barber',
            availability: {
                isAvailable: true,
                workingHours: { start: '09:00', end: '18:00' },
                lunchBreak: { start: '12:00', end: '13:00' },
                offDays: ['Friday'],
                offHours: []
            }
        });

        console.log('✅ Created amin barber');
        console.log(`   Username: amin`);
        console.log(`   Name: امین`);
        console.log(`   Phone: 09191234567`);
        console.log(`   Password: amin123`);
        console.log(`   Role: barber`);
        console.log(`   Status: Available`);

    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
})();
