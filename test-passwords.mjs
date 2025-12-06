import bcrypt from 'bcryptjs';
import fs from 'fs';

async function testPasswordVerification() {
    try {
        console.log('🧪 Testing password verification...\n');

        // Read the JSON file
        const usersData = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));

        const testPasswords = [
            { username: 'hamid', plaintext: 'hamid123' },
            { username: 'benyamin', plaintext: 'benyamin123' },
            { username: 'mohammad', plaintext: 'mohammad123' }
        ];

        for (const test of testPasswords) {
            const user = usersData.find(u => u.username === test.username);
            if (user) {
                console.log(`Testing ${test.username}:`);
                console.log(`  - Hashed: ${user.password}`);
                console.log(`  - Plain:  ${test.plaintext}`);

                const matches = await bcrypt.compare(test.plaintext, user.password);
                console.log(`  - Match:  ${matches ? '✅ YES' : '❌ NO'}\n`);

                if (!matches) {
                    console.log(`⚠️  Password mismatch! Let's hash it again...`);
                    const newHash = await bcrypt.hash(test.plaintext, 10);
                    user.password = newHash;
                    console.log(`  - New hash: ${newHash}\n`);
                }
            }
        }

        // Write back if any changes
        fs.writeFileSync('./data/users.json', JSON.stringify(usersData, null, 2));
        console.log('✅ Test complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testPasswordVerification();
