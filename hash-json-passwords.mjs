import bcrypt from 'bcryptjs';
import fs from 'fs';

async function hashJsonPasswords() {
    try {
        console.log('🔧 Hashing passwords in data/users.json...');

        // Read the JSON file
        const usersData = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));

        // Hash each password
        for (const user of usersData) {
            if (user.password && !user.password.startsWith('$2')) {
                console.log(`🔐 Hashing password for ${user.username}...`);
                const hashedPassword = await bcrypt.hash(user.password, 10);
                user.password = hashedPassword;
                console.log(`✅ Password hashed for ${user.username}`);
            }
        }

        // Write back to file
        fs.writeFileSync('./data/users.json', JSON.stringify(usersData, null, 2));
        console.log('✅ Passwords hashed in data/users.json');

    } catch (error) {
        console.error('❌ Error hashing passwords:', error);
    }
}

hashJsonPasswords();
