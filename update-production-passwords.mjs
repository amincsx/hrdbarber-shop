import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Production MongoDB URI from Liara
const MONGODB_URI = 'mongodb+srv://amin:amin123@table-mountain.liara.cloud/my-app?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function updateProductionPasswords() {
    try {
        console.log('🔧 Connecting to production MongoDB on Liara...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to production database\n');

        const credentials = [
            { username: 'hamid', plainPassword: 'hamid123', name: 'حمید' },
            { username: 'benyamin', plainPassword: 'benyamin123', name: 'بنیامین' },
            { username: 'mohammad', plainPassword: 'mohammad123', name: 'محمد' }
        ];

        for (const cred of credentials) {
            console.log(`🔐 Updating ${cred.username}...`);

            // Hash the password
            const hashedPassword = await bcrypt.hash(cred.plainPassword, 10);

            // Update the user in production database
            const result = await User.findOneAndUpdate(
                { username: cred.username },
                { password: hashedPassword },
                { new: true }
            );

            if (result) {
                console.log(`✅ Updated password for ${cred.username}`);
                console.log(`   New hash: ${hashedPassword}\n`);
            } else {
                console.log(`⚠️  User ${cred.username} not found in production database\n`);
            }
        }

        console.log('✅ Production database passwords updated!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateProductionPasswords();
