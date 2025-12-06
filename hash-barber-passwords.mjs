import bcrypt from 'bcryptjs';
import dbConnect from './src/lib/mongodb.js';
import { User } from './src/lib/models.js';

async function hashBarberPasswords() {
    try {
        await dbConnect();
        console.log('🔧 Starting password hashing for all barbers...');

        // Get all barber users
        const barbers = await User.find({ role: 'barber' });
        console.log(`Found ${barbers.length} barber users`);

        for (const barber of barbers) {
            // Check if password is already hashed (bcrypt hashes are 60 characters and start with $2)
            if (barber.password && !barber.password.startsWith('$2')) {
                console.log(`🔐 Hashing password for ${barber.username}...`);
                const hashedPassword = await bcrypt.hash(barber.password, 10);
                
                // Update the user with hashed password
                await User.findByIdAndUpdate(
                    barber._id,
                    { password: hashedPassword },
                    { new: true }
                );
                console.log(`✅ Password hashed for ${barber.username}`);
            } else {
                console.log(`⏭️  Password already hashed for ${barber.username}`);
            }
        }

        console.log('✅ All barber passwords have been hashed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error hashing passwords:', error);
        process.exit(1);
    }
}

hashBarberPasswords();
