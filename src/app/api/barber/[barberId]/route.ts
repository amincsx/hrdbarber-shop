// TypeScript route handler - redirects to JavaScript implementation
import { NextRequest, NextResponse } from 'next/server';

// This file exists only to satisfy TypeScript compilation
// The actual implementation is in route.js

export async function GET(request: NextRequest, context: any) {
    // This should never be called in production as route.js takes precedence
    return NextResponse.json({ error: 'Use JavaScript route handler' }, { status: 500 });
}

export async function POST(request: NextRequest, context: any) {
    // This should never be called in production as route.js takes precedence
    return NextResponse.json({ error: 'Use JavaScript route handler' }, { status: 500 });
}

export const dynamic = 'force-dynamic';
