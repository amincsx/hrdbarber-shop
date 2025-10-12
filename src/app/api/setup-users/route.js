// Setup endpoint to create admin and barber users in database
import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

export async function POST(request) {
    try {
        const { action, username, password, name, role } = await request.json();

        console.log('🔧 Setup request:', { action, username, name, role });

        if (action === 'create-admin') {
            // Create admin/CEO user
            const adminUsername = username || 'ceo';
            const adminPassword = password || 'your-secure-password-here';
            const adminName = name || 'مدیر سیستم';

            // Check if admin already exists
            const existingAdmin = await MongoDatabase.getUserByUsername(adminUsername);
            if (existingAdmin) {
                return NextResponse.json({
                    success: false,
                    error: 'Admin user already exists',
                    username: adminUsername
                }, { status: 409 });
            }

            // Create admin user
            const adminData = {
                username: adminUsername,
                name: adminName,
                password: adminPassword,
                role: 'admin'
            };

            const newAdmin = await MongoDatabase.addUser(adminData);

            return NextResponse.json({
                success: true,
                message: 'Admin user created successfully',
                user: {
                    username: newAdmin.username,
                    name: newAdmin.name,
                    role: newAdmin.role
                }
            });
        }

        if (action === 'create-barber') {
            // Create barber user
            if (!username || !name) {
                return NextResponse.json({
                    success: false,
                    error: 'Username and name are required'
                }, { status: 400 });
            }

            // Check if user already exists
            const existingUser = await MongoDatabase.getUserByUsername(username);
            if (existingUser) {
                return NextResponse.json({
                    success: false,
                    error: 'User already exists',
                    username: username
                }, { status: 409 });
            }

            // Find barber by name to get barber_id
            const barber = await MongoDatabase.getBarberByName(name);

            // Generate secure password if not provided
            const securePassword = password || MongoDatabase.generateSecurePassword(username);

            // Create barber user
            const barberData = {
                username: username,
                name: name,
                password: securePassword,
                role: 'barber',
                barber_id: barber ? barber._id : null
            };

            const newBarber = await MongoDatabase.addUser(barberData);

            return NextResponse.json({
                success: true,
                message: 'Barber user created successfully',
                user: {
                    username: newBarber.username,
                    name: newBarber.name,
                    role: newBarber.role,
                    password: securePassword,
                    note: 'Save this password! It will not be shown again.'
                }
            });
        }

        if (action === 'update-password') {
            // Update user password
            if (!username || !password) {
                return NextResponse.json({
                    success: false,
                    error: 'Username and password are required'
                }, { status: 400 });
            }

            const user = await MongoDatabase.getUserByUsername(username);
            if (!user) {
                return NextResponse.json({
                    success: false,
                    error: 'User not found'
                }, { status: 404 });
            }

            // Update password
            await MongoDatabase.updateUser(user._id, { password: password });

            return NextResponse.json({
                success: true,
                message: 'Password updated successfully',
                username: username
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Invalid action. Use: create-admin, create-barber, or update-password'
        }, { status: 400 });

    } catch (error) {
        console.error('❌ Setup error:', error);
        return NextResponse.json({
            success: false,
            error: 'Setup failed',
            details: error.message
        }, { status: 500 });
    }
}

// GET - Show current users
export async function GET(request) {
    try {
        const barbers = await MongoDatabase.getUsersByRole('barber');
        const admins = await MongoDatabase.getUsersByRole('admin');

        return NextResponse.json({
            success: true,
            admins: admins.map(u => ({
                username: u.username,
                name: u.name,
                role: u.role
            })),
            barbers: barbers.map(u => ({
                username: u.username,
                name: u.name,
                role: u.role,
                has_password: !!u.password
            })),
            total_admins: admins.length,
            total_barbers: barbers.length
        });

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch users',
            details: error.message
        }, { status: 500 });
    }
}

