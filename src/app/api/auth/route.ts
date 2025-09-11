import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Simple file-based storage (for development)
// In production, you should use a proper database like PostgreSQL
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
}

// Read users from file
async function readUsers() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Write users to file
async function writeUsers(users: any[]) {
    await ensureDataDir();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// POST - Register new user
export async function POST(request: NextRequest) {
    try {
        const userData = await request.json();
        const { first_name, last_name, phone, password } = userData;

        if (!first_name || !last_name || !phone || !password) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        const users = await readUsers();

        // Check if user already exists
        const existingUser = users.find((u: any) => u.phone === phone);
        if (existingUser) {
            return NextResponse.json(
                { error: 'این شماره تلفن قبلاً ثبت شده است' },
                { status: 409 }
            );
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            first_name,
            last_name,
            phone,
            password, // In production, hash this with bcrypt
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        await writeUsers(users);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json({
            message: 'کاربر با موفقیت ثبت شد',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'خطا در ثبت نام' },
            { status: 500 }
        );
    }
}

// GET - Login user (you can also create a separate login endpoint)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const password = searchParams.get('password');

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'شماره تلفن و رمز عبور الزامی است' },
                { status: 400 }
            );
        }

        const users = await readUsers();
        const user = users.find((u: any) => u.phone === phone && u.password === password);

        if (!user) {
            return NextResponse.json(
                { error: 'شماره تلفن یا رمز عبور اشتباه است' },
                { status: 401 }
            );
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            message: 'ورود موفقیت‌آمیز',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'خطا در ورود' },
            { status: 500 }
        );
    }
}
