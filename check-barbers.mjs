// Check what barbers exist
import MongoDatabase from './src/lib/mongoDatabase.js';

async function checkBarbers() {
    try {
        const barbers = await MongoDatabase.getAllBarbers();

        console.log('📋 All barbers in database:');
        if (barbers.length === 0) {
            console.log('❌ No barbers found in database');
        } else {
            barbers.forEach(b => {
                console.log(`\n🏷️  Name: ${b.name}`);
                console.log(`📌 Username: ${b.username}`);
                console.log(`📱 Phone: ${b.phone || 'NOT SET'}`);
                console.log(`🔑 Has phone: ${!!b.phone}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkBarbers().then(() => {
    console.log('\nDone');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});