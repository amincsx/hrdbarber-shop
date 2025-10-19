// Check what database is being used
console.log('Environment variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('\nAfter loading .env.local:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);