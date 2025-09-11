import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB Configuration
const MONGODB_URI = 'mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@hrddatabase:27017/my-app?authSource=admin';
const DATABASE_NAME = 'hrdbarber-shop';

// Global MongoDB client instance
let client: MongoClient;
let db: Db;

// Database connection singleton
export async function connectDB(): Promise<Db> {
    if (db) {
        return db;
    }

    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DATABASE_NAME);
        console.log('Connected to MongoDB successfully');
        return db;
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        throw error;
    }
}

// User interface for MongoDB
export interface User {
    _id?: string;
    phone: string;
    name: string;
    role: 'user' | 'barber' | 'admin';
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    otpCode?: string;
    otpExpiry?: Date;
}

// Booking interface for MongoDB
export interface Booking {
    _id?: string;
    userId: string;
    userName: string;
    userPhone: string;
    barberId?: string;
    dateKey: string;
    startTime: string;
    endTime: string;
    services: string[];
    totalDuration: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Barber interface for MongoDB
export interface Barber {
    _id?: string;
    name: string;
    phone: string;
    specialties: string[];
    isActive: boolean;
    schedule?: {
        [day: string]: {
            start: string;
            end: string;
            isAvailable: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

// Database utility class
export class Database {
    
    // Get users collection
    static async getUsersCollection(): Promise<Collection<User>> {
        const database = await connectDB();
        return database.collection<User>('users');
    }
    
    // Get bookings collection
    static async getBookingsCollection(): Promise<Collection<Booking>> {
        const database = await connectDB();
        return database.collection<Booking>('bookings');
    }
    
    // Get barbers collection
    static async getBarbersCollection(): Promise<Collection<Barber>> {
        const database = await connectDB();
        return database.collection<Barber>('barbers');
    }
    
    // User operations
    static async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
        const users = await this.getUsersCollection();
        const now = new Date();
        const user: User = {
            ...userData,
            createdAt: now,
            updatedAt: now
        };
        
        const result = await users.insertOne(user);
        return { ...user, _id: result.insertedId.toString() };
    }
    
    static async findUserByPhone(phone: string): Promise<User | null> {
        const users = await this.getUsersCollection();
        return await users.findOne({ phone });
    }
    
    static async updateUser(phone: string, updateData: Partial<User>): Promise<boolean> {
        const users = await this.getUsersCollection();
        const result = await users.updateOne(
            { phone },
            { 
                $set: { 
                    ...updateData, 
                    updatedAt: new Date() 
                } 
            }
        );
        return result.modifiedCount > 0;
    }
    
    // Booking operations
    static async createBooking(bookingData: Omit<Booking, '_id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
        const bookings = await this.getBookingsCollection();
        const now = new Date();
        const booking: Booking = {
            ...bookingData,
            createdAt: now,
            updatedAt: now
        };
        
        const result = await bookings.insertOne(booking);
        return { ...booking, _id: result.insertedId.toString() };
    }
    
    static async getBookingsByUser(userPhone: string): Promise<Booking[]> {
        const bookings = await this.getBookingsCollection();
        return await bookings.find({ userPhone }).sort({ createdAt: -1 }).toArray();
    }
    
    static async getBookingsByBarber(barberId: string): Promise<Booking[]> {
        const bookings = await this.getBookingsCollection();
        return await bookings.find({ barberId }).sort({ createdAt: -1 }).toArray();
    }
    
    static async updateBookingStatus(bookingId: string, status: Booking['status'], notes?: string): Promise<Booking | null> {
        const bookings = await this.getBookingsCollection();
        const { ObjectId } = require('mongodb');
        
        const updateData: any = { 
            status, 
            updatedAt: new Date() 
        };
        
        if (notes) {
            updateData.notes = notes;
        }
        
        const result = await bookings.findOneAndUpdate(
            { _id: new ObjectId(bookingId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        return result ? { ...result, _id: result._id.toString() } : null;
    }
    
    // Additional booking methods
    static async findBookingById(bookingId: string): Promise<Booking | null> {
        const bookings = await this.getBookingsCollection();
        const { ObjectId } = require('mongodb');
        const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });
        return booking ? { ...booking, _id: booking._id.toString() } : null;
    }
    
    static async findBookingsByUserId(userId: string): Promise<Booking[]> {
        const bookings = await this.getBookingsCollection();
        return await bookings.find({ userId }).sort({ createdAt: -1 }).toArray();
    }
    
    static async findBookingsByDate(dateKey: string): Promise<Booking[]> {
        const bookings = await this.getBookingsCollection();
        return await bookings.find({ dateKey }).sort({ startTime: 1 }).toArray();
    }
    
    static async findBookingsByDateAndBarber(dateKey: string, barberId: string): Promise<Booking[]> {
        const bookings = await this.getBookingsCollection();
        return await bookings.find({ dateKey, barberId }).toArray();
    }
    
    static async getAllBookings(): Promise<Booking[]> {
        const bookings = await this.getBookingsCollection();
        return await bookings.find({}).sort({ createdAt: -1 }).toArray();
    }
    
    static async deleteBooking(bookingId: string): Promise<boolean> {
        const bookings = await this.getBookingsCollection();
        const { ObjectId } = require('mongodb');
        const result = await bookings.deleteOne({ _id: new ObjectId(bookingId) });
        return result.deletedCount > 0;
    }
    
    // Barber operations
    static async createBarber(barberData: Omit<Barber, '_id' | 'createdAt' | 'updatedAt'>): Promise<Barber> {
        const barbers = await this.getBarbersCollection();
        const now = new Date();
        const barber: Barber = {
            ...barberData,
            createdAt: now,
            updatedAt: now
        };
        
        const result = await barbers.insertOne(barber);
        return { ...barber, _id: result.insertedId.toString() };
    }
    
    static async getAllBarbers(): Promise<Barber[]> {
        const barbers = await this.getBarbersCollection();
        return await barbers.find({ isActive: true }).toArray();
    }
    
    static async findBarberByName(name: string): Promise<Barber | null> {
        const barbers = await this.getBarbersCollection();
        return await barbers.findOne({ name });
    }
    
    // Initialize database with default data
    static async initializeDatabase(): Promise<void> {
        try {
            await connectDB();
            
            // Create default admin user if not exists
            const adminExists = await this.findUserByPhone('09123456789');
            if (!adminExists) {
                await this.createUser({
                    phone: '09123456789',
                    name: 'مدیر سیستم',
                    role: 'admin',
                    isVerified: true
                });
                console.log('Default admin user created');
            }
            
            // Create default barbers if not exists
            const defaultBarbers = [
                {
                    name: 'احمد رضایی',
                    phone: '09121234567',
                    specialties: ['اصلاح مو', 'اصلاح ریش', 'کوتاهی مدرن'],
                    isActive: true,
                    schedule: {
                        saturday: { start: '09:00', end: '21:00', isAvailable: true },
                        sunday: { start: '09:00', end: '21:00', isAvailable: true },
                        monday: { start: '09:00', end: '21:00', isAvailable: true },
                        tuesday: { start: '09:00', end: '21:00', isAvailable: true },
                        wednesday: { start: '09:00', end: '21:00', isAvailable: true },
                        thursday: { start: '09:00', end: '21:00', isAvailable: true },
                        friday: { start: '14:00', end: '21:00', isAvailable: true }
                    }
                },
                {
                    name: 'محمد احمدی',
                    phone: '09127654321',
                    specialties: ['اصلاح کلاسیک', 'آبرو زنی', 'ماساژ سر'],
                    isActive: true,
                    schedule: {
                        saturday: { start: '10:00', end: '20:00', isAvailable: true },
                        sunday: { start: '10:00', end: '20:00', isAvailable: true },
                        monday: { start: '10:00', end: '20:00', isAvailable: true },
                        tuesday: { start: '10:00', end: '20:00', isAvailable: true },
                        wednesday: { start: '10:00', end: '20:00', isAvailable: true },
                        thursday: { start: '10:00', end: '20:00', isAvailable: true },
                        friday: { start: '15:00', end: '20:00', isAvailable: true }
                    }
                }
            ];
            
            for (const barberData of defaultBarbers) {
                const barberExists = await this.findBarberByName(barberData.name);
                if (!barberExists) {
                    await this.createBarber(barberData);
                    console.log(`Default barber ${barberData.name} created`);
                }
            }
            
            // Create indexes for better performance
            const users = await this.getUsersCollection();
            const bookings = await this.getBookingsCollection();
            const barbers = await this.getBarbersCollection();
            
            await users.createIndex({ phone: 1 }, { unique: true });
            await bookings.createIndex({ userPhone: 1 });
            await bookings.createIndex({ barberId: 1 });
            await bookings.createIndex({ dateKey: 1 });
            await barbers.createIndex({ name: 1 }, { unique: true });
            
            console.log('Database indexes created');
            
        } catch (error) {
            console.error('Database initialization failed:', error);
        }
    }
    
    // Close database connection
    static async closeConnection(): Promise<void> {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed');
        }
    }
}

export default Database;