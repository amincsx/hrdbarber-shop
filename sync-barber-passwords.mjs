import bcrypt from 'bcryptjs';
import dbConnect from './src/lib/mongodb.js';
import { User } from './src/lib/models.js';

async function updateBarberPasswords() {
    try {
        await dbConnect();
        console.log('🔧 Updating barber passwords to match credentials...');

        const credentials = [
            { username: 'hamid', plainPassword: 'hamid123', name: 'حمید' },
            { username: 'benyamin', plainPassword: 'benyamin123', name: 'بنیامین' },
            { username: 'mohammad', plainPassword: 'mohammad123', name: 'محمد' }
        ];

        for (const cred of credentials) {
            console.log(`\n🔐 Processing ${cred.username}...`);
            
            // Find the user
            let user = await User.findOne({ username: cred.username });
            
            if (!user) {
                console.log(`❌ User ${cred.username} not found, creating...`);
                // Create the user if it doesn't exist
                const hashedPassword = await bcrypt.hash(cred.plainPassword, 10);
                user = new User({
                    username: cred.username,
                    name: cred.name,
                    password: hashedPassword,
                    role: 'barber'
                });
                await user.save();
                console.log(`✅ Created user ${cred.username}`);
            } else {
                // Update existing user's password
                console.log(`Found existing user: ${user.name}`);
                const hashedPassword = await bcrypt.hash(cred.plainPassword, 10);
                
                // Update the password
                user.password = hashedPassword;
                await user.save();
                console.log(`✅ Updated password for ${cred.username}`);
            }
        }

        console.log('\n✅ All barber passwords updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateBarberPasswords();
