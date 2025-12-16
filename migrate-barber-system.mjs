import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'my-app';

async function migrateBarberSystem() {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();

        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');
        const barbersCollection = db.collection('barbers');
        const bookingsCollection = db.collection('bookings');

        console.log('\n🔧 MIGRATING BARBER SYSTEM TO USE IDs\n');

        // Step 1: Ensure all barber users have barber records
        const barberUsers = await usersCollection.find({
            $or: [{ role: 'barber' }, { type: 'barber' }]
        }).toArray();

        console.log(`📊 Found ${barberUsers.length} barber users`);

        for (const user of barberUsers) {
            console.log(`\n🔍 Processing user: ${user.name} (${user.username})`);

            // Find or create barber record
            let barber = null;

            // First try to find by user.barber_id
            if (user.barber_id) {
                barber = await barbersCollection.findOne({ _id: new ObjectId(user.barber_id) });
                if (barber) {
                    console.log(`  ✅ Found linked barber record: ${barber._id}`);
                }
            }

            // If not found, try to find by name
            if (!barber) {
                barber = await barbersCollection.findOne({ name: user.name });
                if (barber) {
                    console.log(`  🔗 Found barber by name, linking: ${barber._id}`);
                    // Link user to barber
                    await usersCollection.updateOne(
                        { _id: user._id },
                        { $set: { barber_id: barber._id, role: 'barber' } }
                    );
                }
            }

            // If still not found, create new barber record
            if (!barber) {
                console.log(`  ➕ Creating new barber record`);
                const newBarber = {
                    name: user.name,
                    phone: user.phone || user.username || '',
                    specialties: [],
                    isActive: true,
                    schedule: {},
                    availability: user.availability || {},
                    user_id: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const insertResult = await barbersCollection.insertOne(newBarber);
                barber = { ...newBarber, _id: insertResult.insertedId };

                // Link user to new barber
                await usersCollection.updateOne(
                    { _id: user._id },
                    { $set: { barber_id: barber._id, role: 'barber' } }
                );

                console.log(`  ✅ Created and linked barber: ${barber._id}`);
            }

            // Step 2: Update all bookings for this barber to use barber_id
            const oldNameVariants = [user.name, user.username];
            console.log(`  🔄 Updating bookings for name variants: ${oldNameVariants.join(', ')}`);

            let totalUpdated = 0;
            for (const nameVariant of oldNameVariants) {
                if (!nameVariant) continue;

                const updateResult = await bookingsCollection.updateMany(
                    {
                        barber: nameVariant,
                        barber_id: { $exists: false } // Only update if barber_id doesn't exist
                    },
                    {
                        $set: {
                            barber_id: barber._id,
                            barber: user.name, // Standardize to user.name
                            updated_at: new Date()
                        }
                    }
                );

                totalUpdated += updateResult.modifiedCount;
                if (updateResult.modifiedCount > 0) {
                    console.log(`    📝 Updated ${updateResult.modifiedCount} bookings for "${nameVariant}"`);
                }
            }

            console.log(`  ✅ Total bookings updated: ${totalUpdated}`);
        }

        // Step 3: Verify the migration
        console.log('\n📊 MIGRATION VERIFICATION:\n');

        const allBarbers = await barbersCollection.find({}).toArray();
        console.log(`📋 Total barber records: ${allBarbers.length}`);

        for (const barber of allBarbers) {
            const bookingCount = await bookingsCollection.countDocuments({ barber_id: barber._id });
            const oldBookingCount = await bookingsCollection.countDocuments({
                barber: barber.name,
                barber_id: { $exists: false }
            });

            console.log(`  ${barber.name} (${barber._id}):`);
            console.log(`    - Bookings with barber_id: ${bookingCount}`);
            console.log(`    - Old bookings without barber_id: ${oldBookingCount}`);
        }

        // Step 4: Clean up any orphaned bookings
        const orphanedBookings = await bookingsCollection.find({
            barber_id: { $exists: false }
        }).toArray();

        if (orphanedBookings.length > 0) {
            console.log(`\n⚠️  Found ${orphanedBookings.length} orphaned bookings (no barber_id):`);
            for (const booking of orphanedBookings) {
                console.log(`    - "${booking.barber}" on ${booking.date_key} for ${booking.user_name}`);
            }
        }

        console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('\n🔧 Next steps:');
        console.log('1. Update barber dashboard URLs to use barber IDs');
        console.log('2. Update booking API to use barber_id instead of barber name');
        console.log('3. Update barber authentication to work with IDs');

    } catch (error) {
        console.error('❌ Migration error:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

migrateBarberSystem();