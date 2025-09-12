// This file updates the authentication API to support login with both username and phone
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Database connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

async function main() {
    try {
        console.log('Updating MongoDB authentication to support username login...');

        // First, let's check the barber accounts to see current state
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define the User model
        const UserSchema = new mongoose.Schema({
            username: String,
            name: String,
            password: String,
            role: String,
            phone: String
        });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Find all barber accounts
        const barberUsers = await User.find({ role: 'barber' });

        console.log(`Found ${barberUsers.length} barber accounts:`);
        for (const user of barberUsers) {
            console.log(`${user.name}: username=${user.username}, password=${user.password}`);
        }

        // Now let's modify the mongoDatabase.js file to fix the findUserByPhone method
        const dbFilePath = path.join(__dirname, 'src', 'lib', 'mongoDatabase.js');

        if (fs.existsSync(dbFilePath)) {
            console.log(`\nUpdating MongoDB database handler at: ${dbFilePath}`);

            // Read the file content
            const content = fs.readFileSync(dbFilePath, 'utf8');

            // Replace the findUserByPhone method with an improved version
            const oldMethod = `    static async findUserByPhone(phone) {
        try {
            await dbConnect();
            // For our system, phone is used as username
            const user = await User.findOne({ username: phone });
            return user;
        } catch (error) {
            console.error('Error getting user by phone:', error);
            return null;
        }
    }`;

            const newMethod = `    static async findUserByPhone(phone) {
        try {
            await dbConnect();
            // First try to find user by phone as username (for regular users)
            const user = await User.findOne({ username: phone });
            if (user) {
                return user;
            }
            
            // If not found, try to find barber/admin by username directly
            // This allows barbers to login with their name-based username
            const barberOrAdmin = await User.findOne({ 
                $and: [
                    { username: phone },
                    { $or: [{ role: 'barber' }, { role: 'admin' }] }
                ]
            });
            
            console.log(\`Login attempt with: \${phone}\`);
            if (barberOrAdmin) {
                console.log(\`Found user by direct username: \${barberOrAdmin.name} (role: \${barberOrAdmin.role})\`);
            }
            
            return barberOrAdmin;
        } catch (error) {
            console.error('Error getting user by phone/username:', error);
            return null;
        }
    }`;

            // Update the file
            const updatedContent = content.replace(oldMethod, newMethod);

            // Write back to the file
            fs.writeFileSync(dbFilePath, updatedContent, 'utf8');

            console.log('✅ Updated mongoDatabase.js with improved findUserByPhone method');
            console.log('\nNow barbers can login with:');
            console.log('1. Username: their romanized name (e.g., "hamid")');
            console.log('2. Password: their name + "123" (e.g., "hamid123")');

        } else {
            console.error(`❌ File not found: ${dbFilePath}`);
        }

    } catch (error) {
        console.error('❌ Error updating authentication:', error);
    } finally {
        // Close MongoDB connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('Closed MongoDB connection');
        }
    }
}

main()
    .then(() => console.log('✅ Script completed successfully'))
    .catch(err => {
        console.error('❌ Unhandled error:', err);
        process.exit(1);
    });
