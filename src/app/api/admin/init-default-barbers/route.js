import { NextResponse } from 'next/server';
import MongoDatabase from '../../../../lib/mongoDatabase.js';
import bcrypt from 'bcryptjs';

// Initialize default barbers
const defaultBarbers = [
    {
        username: 'hamid',
        name: 'حمید',
        password: 'hamid1234',
        role: 'barber',
        phone: '09123456001'
    },
    {
        username: 'benyamin',
        name: 'بنیامین',
        password: 'benyamin1234',
        role: 'barber',
        phone: '09123456002'
    },
    {
        username: 'mohammad',
        name: 'محمد',
        password: 'mohammad1234',
        role: 'barber',
        phone: '09123456003'
    }
];

export async function POST() {
    try {
        console.log('🔧 Initializing default barbers...');

        const results = [];

        for (const barberData of defaultBarbers) {
            try {
                // Check if barber already exists
                const existingUser = await MongoDatabase.getUserByUsername(barberData.username);

                if (existingUser) {
                    console.log(`👤 Barber ${barberData.username} already exists, skipping...`);
                    results.push({
                        username: barberData.username,
                        status: 'exists',
                        message: 'Already exists'
                    });
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(barberData.password, 10);

                // Create barber user
                const newUser = await MongoDatabase.addUser({
                    username: barberData.username,
                    name: barberData.name,
                    password: hashedPassword,
                    role: barberData.role,
                    phone: barberData.phone,
                    isVerified: true
                });

                if (newUser) {
                    console.log(`✅ Created barber: ${barberData.username} (${barberData.name})`);
                    results.push({
                        username: barberData.username,
                        name: barberData.name,
                        status: 'created',
                        message: 'Successfully created'
                    });
                } else {
                    throw new Error('Failed to create user');
                }

            } catch (error) {
                console.error(`❌ Error creating barber ${barberData.username}:`, error);
                results.push({
                    username: barberData.username,
                    status: 'error',
                    message: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Default barbers initialization completed',
            results
        });

    } catch (error) {
        console.error('❌ Error initializing default barbers:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to initialize default barbers',
            details: error.message
        }, { status: 500 });
    }
}

// GET - Check if default barbers exist
export async function GET() {
    try {
        const results = [];

        for (const barberData of defaultBarbers) {
            const existingUser = await MongoDatabase.getUserByUsername(barberData.username);
            results.push({
                username: barberData.username,
                name: barberData.name,
                exists: !!existingUser,
                verified: existingUser?.isVerified || false
            });
        }

        return NextResponse.json({
            success: true,
            barbers: results
        });

    } catch (error) {
        console.error('❌ Error checking default barbers:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to check default barbers',
            details: error.message
        }, { status: 500 });
    }
}