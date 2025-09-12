// Script to fix barber names in MongoDB
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrdbarber';

async function fixBarbers() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const barbersCollection = db.collection('barbers');

        // Remove all existing barbers
        await barbersCollection.deleteMany({});
        console.log('Removed all existing barbers');

        // Add the correct barbers
        const correctBarbers = [
            {
                name: 'حمید',
                phone: '09121234567',
                specialties: ['کوتاهی مو', 'اصلاح ریش', 'رنگ مو'],
                isActive: true,
                schedule: {
                    saturday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    sunday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    monday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    tuesday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    wednesday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    thursday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    friday: { isWorking: false, startTime: '', endTime: '' }
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'بنیامین',
                phone: '09127654321',
                specialties: ['کوتاهی مو', 'اصلاح ریش', 'ماساژ سر'],
                isActive: true,
                schedule: {
                    saturday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    sunday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    monday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    tuesday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    wednesday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    thursday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    friday: { isWorking: false, startTime: '', endTime: '' }
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'محمد',
                phone: '09129876543',
                specialties: ['کوتاهی مو', 'اصلاح ریش', 'رنگ مو'],
                isActive: true,
                schedule: {
                    saturday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    sunday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    monday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    tuesday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    wednesday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    thursday: { isWorking: true, startTime: '09:00', endTime: '20:00' },
                    friday: { isWorking: false, startTime: '', endTime: '' }
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        const result = await barbersCollection.insertMany(correctBarbers);
        console.log(`Inserted ${result.insertedCount} barbers`);

        // Verify the barbers
        const allBarbers = await barbersCollection.find({}).toArray();
        console.log('Current barbers in database:');
        allBarbers.forEach(barber => {
            console.log(`- ${barber.name} (${barber.phone})`);
        });

    } catch (error) {
        console.error('Error fixing barbers:', error);
    } finally {
        await client.close();
    }
}

fixBarbers();
