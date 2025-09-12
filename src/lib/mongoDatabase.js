import dbConnect from './mongodb.js';
import { Barber, Booking, User } from './models.js';

class MongoDatabase {
    
    // Barber operations
    static async getAllBarbers() {
        try {
            await dbConnect();
            const barbers = await Barber.find({ isActive: true }).sort({ name: 1 });
            return barbers;
        } catch (error) {
            console.error('Error getting barbers:', error);
            return [];
        }
    }

    static async getBarberById(id) {
        try {
            await dbConnect();
            const barber = await Barber.findById(id);
            return barber;
        } catch (error) {
            console.error('Error getting barber by ID:', error);
            return null;
        }
    }

    static async getBarberByName(name) {
        try {
            await dbConnect();
            const barber = await Barber.findOne({ name: name });
            return barber;
        } catch (error) {
            console.error('Error getting barber by name:', error);
            return null;
        }
    }

    // Booking operations
    static async getAllBookings() {
        try {
            await dbConnect();
            const bookings = await Booking.find().sort({ created_at: -1 });
            return bookings;
        } catch (error) {
            console.error('Error getting bookings:', error);
            return [];
        }
    }

    static async addBooking(bookingData) {
        try {
            await dbConnect();
            
            // Find barber by name to get ID
            const barber = await Barber.findOne({ name: bookingData.barber });
            if (barber) {
                bookingData.barber_id = barber._id;
            }

            const booking = new Booking(bookingData);
            const savedBooking = await booking.save();
            
            console.log('✅ Booking saved to MongoDB:', savedBooking._id);
            return savedBooking;
        } catch (error) {
            console.error('Error saving booking:', error);
            throw error;
        }
    }

    static async getBookingsByBarber(barberName) {
        try {
            await dbConnect();
            const bookings = await Booking.find({ barber: barberName }).sort({ created_at: -1 });
            return bookings;
        } catch (error) {
            console.error('Error getting bookings by barber:', error);
            return [];
        }
    }

    static async getBookingsByDate(dateKey) {
        try {
            await dbConnect();
            const bookings = await Booking.find({ date_key: dateKey }).sort({ start_time: 1 });
            return bookings;
        } catch (error) {
            console.error('Error getting bookings by date:', error);
            return [];
        }
    }

    // User authentication operations
    static async getUserByUsername(username) {
        try {
            await dbConnect();
            const user = await User.findOne({ username: username });
            return user;
        } catch (error) {
            console.error('Error getting user by username:', error);
            return null;
        }
    }

    static async addUser(userData) {
        try {
            await dbConnect();
            const user = new User(userData);
            const savedUser = await user.save();
            console.log('✅ User saved to MongoDB:', savedUser._id);
            return savedUser;
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }

    static async getUsersByRole(role) {
        try {
            await dbConnect();
            const users = await User.find({ role: role });
            return users;
        } catch (error) {
            console.error('Error getting users by role:', error);
            return [];
        }
    }

    // Initialize barber authentication accounts
    static async initializeBarberAuth() {
        try {
            await dbConnect();
            console.log('🔧 Initializing barber authentication...');

            // Get all active barbers from your existing data
            const barbers = await Barber.find({ isActive: true });
            
            for (const barber of barbers) {
                // Check if user account already exists
                const existingUser = await User.findOne({ 
                    $or: [
                        { username: barber.username },
                        { barber_id: barber._id }
                    ]
                });

                if (!existingUser) {
                    // Create username from name (simplified)
                    let username = barber.username;
                    if (!username) {
                        // Generate username from name if not exists
                        username = barber.name
                            .replace(/\s+/g, '')
                            .toLowerCase()
                            .replace(/[^\w]/g, '');
                    }

                    // Create user account for barber
                    const userData = {
                        username: username,
                        name: barber.name,
                        password: `${username}123`, // Simple password pattern
                        role: 'barber',
                        barber_id: barber._id
                    };

                    await this.addUser(userData);
                    console.log(`✅ Created auth account for barber: ${barber.name} (${username})`);
                } else {
                    console.log(`ℹ️ Auth account already exists for: ${barber.name}`);
                }
            }

            console.log('✅ Barber authentication initialization completed');
            
        } catch (error) {
            console.error('Error initializing barber authentication:', error);
            throw error;
        }
    }
}

export default MongoDatabase;
