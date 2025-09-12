// Script to test barber and CEO login
require('dotenv').config();
const mongoose = require('mongoose');

// Database connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

async function testLogin(username, password, type) {
    console.log(`\nTesting ${type} login: ${username} / ${password}`);

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);

        // Define models directly here
        const UserSchema = new mongoose.Schema({
            username: String,
            name: String,
            password: String,
            role: String
        });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Attempt login
        let user;

        if (type === 'barber') {
            // Barber login
            user = await User.findOne({
                username: username,
                role: 'barber'
            });
        } else if (type === 'admin') {
            // CEO/Admin login
            user = await User.findOne({
                username: username,
                role: 'admin'
            });
        }

        if (!user) {
            console.log(`❌ ${type} not found with username: ${username}`);
            return false;
        }

        if (user.password !== password) {
            console.log(`❌ Password mismatch for ${username}`);
            console.log(`   Expected: ${user.password}`);
            console.log(`   Provided: ${password}`);
            return false;
        }

        console.log(`✅ ${type} login successful!`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        return true;

    } catch (error) {
        console.error(`❌ Error testing ${type} login:`, error);
        return false;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
}

async function main() {
    try {
        // Test barber login (hamid/hamid123)
        await testLogin('hamid', 'hamid123', 'barber');

        // Test CEO login (ceo/instad)
        await testLogin('ceo', 'instad', 'admin');

    } catch (error) {
        console.error('❌ Unhandled error:', error);
    }
}

main()
    .then(() => console.log('\n✅ Login tests completed'))
    .catch(err => {
        console.error('❌ Unhandled error:', err);
        process.exit(1);
    });
