// Debug barber users in database
import MongoDatabase from './src/lib/mongoDatabase.js';
import mongoose from 'mongoose';
import { User, BarberActivity } from './src/lib/models.js';

async function debugBarberUsers() {
    try {
        console.log('🔍 Debugging barber users...');

        // Get all users with role 'barber'
        const barberUsers = await MongoDatabase.getUsersByRole('barber');
        console.log('\n👥 All barber users:');
        barberUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.username}) - ID: ${user._id}`);
        });

        // Check for 'امین' specifically
        console.log('\n🔍 Looking up barber by name "امین":');
        const barberByName = barberUsers.find(u => u.name === 'امین');
        if (barberByName) {
            console.log(`Found: ${barberByName.username} - ID: ${barberByName._id}`);
        } else {
            console.log('Not found by name');
        }

        console.log('\n🔍 Looking up user by username "amin":');
        const userByUsername = await MongoDatabase.getUserByUsername('amin');
        if (userByUsername) {
            console.log(`Found: ${userByUsername.name} (${userByUsername.username}) - ID: ${userByUsername._id}`);
        } else {
            console.log('Not found by username');
        }

        // Check for duplicate users
        console.log('\n🔍 Checking for duplicate users...');
        const allUsers = await User.find({});
        const usernameCounts = {};
        const nameCounts = {};

        allUsers.forEach(user => {
            usernameCounts[user.username] = (usernameCounts[user.username] || 0) + 1;
            if (user.name) {
                nameCounts[user.name] = (nameCounts[user.name] || 0) + 1;
            }
        });

        console.log('📊 Username counts:', usernameCounts);
        console.log('📊 Name counts:', nameCounts);

        // Check all activities in database
        console.log('\n📋 All activities in database:');
        const allActivities = await BarberActivity.find({});
        console.log(`Total activities: ${allActivities.length}`);
        allActivities.forEach((activity, index) => {
            console.log(`${index + 1}. Barber: ${activity.barber_id}, Customer: ${activity.customer_name}, Action: ${activity.action}`);
        });

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('🔌 Database connection closed');
        }
    }
}

debugBarberUsers();