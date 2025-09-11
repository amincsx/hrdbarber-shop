import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const BARBERS_FILE = path.join(DATA_DIR, 'barbers.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
}

// Read barbers from file
async function readBarbers() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(BARBERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Write barbers to file
async function writeBarbers(barbers: any[]) {
    await ensureDataDir();
    await fs.writeFile(BARBERS_FILE, JSON.stringify(barbers, null, 2));
}

// POST - Barber/Owner login
export async function POST(request: NextRequest) {
    try {
        const { username, password, type } = await request.json();

        if (!username || !password || !type) {
            return NextResponse.json(
                { error: 'تمام فیلدها الزامی است' },
                { status: 400 }
            );
        }

        const barbers = await readBarbers();

        if (type === 'owner') {
            // Owner login (you can change these credentials)
            if (username === 'owner' && password === 'owner123') {
                return NextResponse.json({
                    success: true,
                    user: {
                        id: 'owner',
                        name: 'مالک آرایشگاه',
                        type: 'owner',
                        permissions: ['view_all', 'manage_all']
                    }
                });
            }
        } else if (type === 'barber') {
            // Barber login
            const barber = barbers.find((b: any) =>
                b.username === username && b.password === password
            );

            if (barber) {
                return NextResponse.json({
                    success: true,
                    user: {
                        id: barber.id,
                        name: barber.name,
                        username: barber.username,
                        type: 'barber',
                        permissions: ['view_own']
                    }
                });
            }
        }

        return NextResponse.json(
            { error: 'نام کاربری یا رمز عبور اشتباه است' },
            { status: 401 }
        );

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'خطا در ورود به سیستم' },
            { status: 500 }
        );
    }
}

// GET - Get all barbers (for owner only)
export async function GET(request: NextRequest) {
    try {
        const barbers = await readBarbers();

        // Remove passwords from response
        const publicBarbers = barbers.map((b: any) => ({
            id: b.id,
            name: b.name,
            username: b.username,
            created_at: b.created_at
        }));

        return NextResponse.json(publicBarbers);

    } catch (error) {
        console.error('Error fetching barbers:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت اطلاعات آرایشگران' },
            { status: 500 }
        );
    }
}
