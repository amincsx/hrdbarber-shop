// Script to create a specific barber or admin account
import MongoDatabase from './src/lib/mongoDatabase.js';
import { User, Barber } from './src/lib/models.js';
import dbConnect from './src/lib/mongodb.js';

async function createAccount(username, name, password, role, barberName = null) {
    try {
        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            console.log(`⚠️ User with username "${username}" already exists`);
            return;
        }

        const userData = {
            username,
            name,
            password,
            role
        };

        // If it's a barber role, try to find and link the barber_id
        if (role === 'barber' && barberName) {
            const barber = await Barber.findOne({ name: barberName });
            if (barber) {
                userData.barber_id = barber._id;
                console.log(`Found barber ID for ${barberName}: ${barber._id}`);
            } else {
                console.log(`⚠️ Could not find barber with name: ${barberName}`);
            }
        }

        const newUser = await MongoDatabase.addUser(userData);
        console.log(`✅ Created new ${role} account:`);
        console.log(`Username: ${newUser.username}`);
        console.log(`Name: ${newUser.name}`);
        console.log(`Role: ${newUser.role}`);

        if (newUser.barber_id) {
            console.log(`Barber ID: ${newUser.barber_id}`);
        }

    } catch (error) {
        console.error('❌ Error creating account:', error);
    }
}

// Create a CEO account
async function createCEOAccount() {
    await createAccount('ceo', 'CEO User', 'ceo123', 'admin');
}

// Create a barber account
async function createBarberAccount(username, name, barberName) {
    await createAccount(username, name, `${username}123`, 'barber', barberName);
}

// Run one of these functions depending on what you need
async function main() {
    // Uncomment the function you want to run
    await createCEOAccount();
    // await createBarberAccount('barber1', 'Barber One', 'Actual Barber Name from Barber collection');
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Unhandled error:', err);
        process.exit(1);
    });
