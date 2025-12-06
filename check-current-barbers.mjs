import MongoDatabase from './src/lib/mongoDatabase.js';

(async () => {
    try {
        const barbers = await MongoDatabase.getAllBarbers();
        console.log('All barbers in database:');
        barbers.forEach(b => {
            console.log(`  - ${b.name} (${b.username}): Phone: ${b.phone || 'NOT SET'}`);
        });
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
})();
