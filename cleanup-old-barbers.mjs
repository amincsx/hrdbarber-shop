import MongoDatabase from './src/lib/mongoDatabase.js';

(async () => {
    try {
        console.log('🔄 Removing old barbers...');

        // Delete by username (not by ID)
        const User = (await import('./src/lib/models.js')).User;
        await User.deleteMany({ username: { $in: ['hamid', 'benyamin', 'mohammad'] } });
        console.log('✅ Old barbers removed');

        console.log('\n📊 Current barbers in system:');
        const barbers = await MongoDatabase.getAllBarbers();
        barbers.forEach(b => {
            console.log(`   ✓ ${b.name} (${b.username}): ${b.phone}`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
})();
