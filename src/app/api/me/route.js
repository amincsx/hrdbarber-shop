import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(/token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: 'توکن یافت نشد' }, { status: 401 });
    }
    const token = tokenMatch[1];
    const jwtSecret = process.env.JWT_SECRET || 'your-very-secret-key';
    let user;
    try {
      user = jwt.verify(token, jwtSecret);
    } catch (err) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات کاربر' }, { status: 500 });
  }
}
