import MongoDatabase from './src/lib/mongoDatabase.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

(async () => {
  try {
    console.log('🔧 Fixing barber username...\n');

    // Connect to Liara MongoDB
    const mongoUri = 'mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@table-mountain.liara.cloud:34674/my-app?authSource=admin';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      retryWrites: true
    });
    console.log('✅ Connected to Liara MongoDB\n');

    // Find the current barber (mamin or امینا)
    const { User } = await import('./src/lib/models.js');
    const barber = await User.findOne({ username: 'mamin' });

    if (!barber) {
      console.log('❌ Barber not found');
      process.exit(0);
    }

    console.log('📊 Current barber:');
    console.log(`  Username: ${barber.username}`);
    console.log(`  Name: ${barber.name}`);
    console.log(`  ID: ${barber._id}`);

    // Update username to 'amin'
    const updated = await User.findByIdAndUpdate(barber._id, { username: 'amin' }, { new: true });

    console.log('\n✅ Barber username updated to: amin');
    console.log(`✅ Verified: ${updated.username} (${updated.name})`);

    await mongoose.disconnect();

  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  process.exit(0);
})();
