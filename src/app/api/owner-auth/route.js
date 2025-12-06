import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // Owner credentials
        const OWNER_CREDENTIALS = {
            username: 'hamidrezadadgar1374',
            password: '09196247960'
        };

        // Validate credentials
        if (username === OWNER_CREDENTIALS.username && password === OWNER_CREDENTIALS.password) {
            return NextResponse.json({
                success: true,
                user: {
                    username: username,
                    name: 'حمیدرضا دادگر',
                    role: 'owner',
                    type: 'owner'
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'نام کاربری یا رمز عبور اشتباه است'
            }, { status: 401 });
        }
    } catch (error) {
        console.error('Owner auth error:', error);
        return NextResponse.json({
            success: false,
            message: 'خطا در سرور'
        }, { status: 500 });
    }
}