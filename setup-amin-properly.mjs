import MongoDatabase from './src/lib/mongoDatabase.js';
import bcrypt from 'bcryptjs';

(async () => {
    try {
        console.log('🔧 Setting up amin barber properly...');

        // Remove any existing amin records
        const User = (await import('./src/lib/models.js')).User;
        const Barber = (await import('./src/lib/models.js')).Barber;

        await User.deleteMany({ username: 'amin' });
        await Barber.deleteMany({ username: 'amin' });
        console.log('✅ Cleaned existing amin records');

        // Hash password
        const hashedPassword = await bcrypt.hash('amin123', 10);

        // Step 1: Create barber in Barber collection
        const barberData = {
            name: 'امین',
            phone: '09191234567',
            username: 'amin',
            password: hashedPassword,
            isActive: true,
            specialties: ['اصلاح مو', 'اصلاح ریش'],
            schedule: {
                workingHours: { start: '09:00', end: '18:00' },
                lunchBreak: { start: '12:00', end: '13:00' },
                offDays: ['Friday'],
                offHours: []
            }
        };

        const newBarber = await MongoDatabase.addBarber(barberData);
        console.log('✅ Barber created in Barbers collection:', newBarber._id);

        // Step 2: Create user account linked to barber
        const userData = {
            username: 'amin',
            name: 'امین',
            phone: '09191234567',
            password: hashedPassword,
            role: 'barber',
            barber_id: newBarber._id,
            isVerified: true,
            availability: {
                isAvailable: true,
                workingHours: { start: '09:00', end: '18:00' },
                lunchBreak: { start: '12:00', end: '13:00' },
                offDays: ['Friday'],
                offHours: []
            }
        };

        const newUser = await MongoDatabase.createUser(userData);
        console.log('✅ User account created linked to barber:', newUser._id);

        console.log('\n📊 Amin barber setup complete:');
        console.log('   Username: amin');
        console.log('   Password: amin123');
        console.log('   Phone: 09191234567');
        console.log('   Name: امین');
        console.log('   Collections: Both Barber and User');

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    process.exit(0);
})();