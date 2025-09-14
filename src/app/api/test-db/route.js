// 🧪 DATABASE CONNECTION TEST ENDPOINT
// Use this to test if your database connection is working in production

import { NextResponse } from 'next/server';
import MongoDatabase from '../../../lib/mongoDatabase.js';

export async function GET() {
    try {
        console.log('🧪 Testing database connection...');
        
        // Test basic connection
        const barbers = await MongoDatabase.getAllBarbers();
        
        return NextResponse.json({
            success: true,
            message: 'Database connection successful!',
            data: {
                barbersCount: barbers.length,
                environment: process.env.NODE_ENV,
                mongodbUriSet: !!process.env.MONGODB_URI,
                databaseUrlSet: !!process.env.DATABASE_URL,
                mongodbUrlSet: !!process.env.MONGODB_URL
            }
        });

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        
        return NextResponse.json({
            success: false,
            message: 'Database connection failed',
            error: error.message,
            errorType: error.name,
            environment: process.env.NODE_ENV,
            mongodbUriSet: !!process.env.MONGODB_URI,
            databaseUrlSet: !!process.env.DATABASE_URL,
            mongodbUrlSet: !!process.env.MONGODB_URL,
            solutions: [
                'Set MONGODB_URI in Liara dashboard',
                'Check MongoDB connection string',
                'Verify network access in MongoDB Atlas',
                'Ensure MongoDB server is running'
            ]
        }, { status: 500 });
    }
}
