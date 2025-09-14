// 🔍 ENVIRONMENT VARIABLES CHECK ENDPOINT
// This will show you exactly what environment variables are set in production

import { NextResponse } from 'next/server';

export async function GET() {
    const envCheck = {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI ? 'SET (length: ' + process.env.MONGODB_URI.length + ')' : 'NOT SET',
        DATABASE_URL: process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET',
        MONGODB_URL: process.env.MONGODB_URL ? 'SET (length: ' + process.env.MONGODB_URL.length + ')' : 'NOT SET',
        SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
        TSC_COMPILE_ON_ERROR: process.env.TSC_COMPILE_ON_ERROR,
        DISABLE_ESLINT: process.env.DISABLE_ESLINT
    };

    // Show the actual URI (with credentials hidden)
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGODB_URL || 'mongodb://localhost:27017/hrdbarber';
    const hiddenUri = uri.replace(/\/\/.*@/, '//***:***@');

    return NextResponse.json({
        message: 'Environment Variables Check',
        environment: envCheck,
        usingUri: hiddenUri,
        isProduction: process.env.NODE_ENV === 'production',
        instructions: {
            ifMongoDbUriNotSet: 'Go to Liara Dashboard → Environment Variables → Add: MONGODB_URI=mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@hrddatabase:27017/my-app?authSource=admin',
            ifStillNotWorking: 'Check Liara logs for the debug messages starting with 🔍 PRODUCTION ENVIRONMENT DEBUG'
        }
    });
}
