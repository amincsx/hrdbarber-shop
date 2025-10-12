// API endpoint to initialize barber authentication accounts
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

export async function GET(request) {
    try {
        console.log('🔧 Initializing barber authentication...');

        // Initialize barber auth accounts (returns newly created accounts with passwords)
        const newAccounts = await MongoDatabase.initializeBarberAuth();

        // Get all barbers to verify
        const barbers = await MongoDatabase.getAllBarbers();
        console.log('📊 Found', barbers.length, 'barbers in database');

        // Get all users with barber role
        const barberUsers = await MongoDatabase.getUsersByRole('barber');
        console.log('📊 Found', barberUsers.length, 'barber user accounts');

        // Create a mapping for verification
        const mappings = barberUsers.map(user => ({
            username: user.username,
            name: user.name,
            role: user.role,
            barber_id: user.barber_id,
            has_password: !!user.password
        }));

        return NextResponse.json({
            success: true,
            message: 'Barber authentication initialized successfully',
            barbers_count: barbers.length,
            user_accounts_count: barberUsers.length,
            newly_created: newAccounts.length,
            new_accounts: newAccounts, // Shows username and generated password
            existing_mappings: mappings,
            important_note: 'Save the passwords shown in new_accounts array! These are secure random passwords.'
        });

    } catch (error) {
        console.error('❌ Error initializing barbers:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to initialize barber authentication',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

// POST endpoint to manually add a barber user
export async function POST(request) {
    try {
        const { username, name, password } = await request.json();

        if (!username || !name) {
            return NextResponse.json(
                { error: 'Username and name are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await MongoDatabase.getUserByUsername(username);
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists', username: username },
                { status: 409 }
            );
        }

        // Find barber by name
        const barber = await MongoDatabase.getBarberByName(name);
        
        // Create user account
        const userData = {
            username: username,
            name: name,
            password: password || `${username}123`,
            role: 'barber',
            barber_id: barber ? barber._id : null
        };

        const newUser = await MongoDatabase.addUser(userData);

        return NextResponse.json({
            success: true,
            message: 'Barber user created successfully',
            user: {
                username: newUser.username,
                name: newUser.name,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('❌ Error creating barber user:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to create barber user',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

