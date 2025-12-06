import dbConnect from './mongodb.js';
import { Barber, Booking, User } from './models.js';
import { initializeProductionDatabase } from './initProductionDB.js';

class MongoDatabase {

    // Barber operations
    static async getAllBarbers() {
        try {
            await dbConnect();

            // Production database initialization temporarily disabled to fix connection issues
            // Will be re-enabled once basic connection is working

            // Get all barber users (those with role 'barber')
            const barberUsers = await User.find({ role: 'barber' }).sort({ createdAt: 1 });

            // Convert to the expected format and include username
            const barbers = barberUsers.map(user => ({
                _id: user._id,
                name: user.name,
                username: user.username,
                phone: user.phone,
                isAvailable: user.availability?.isAvailable !== false,
                availability: user.availability,
                createdAt: user.createdAt
            }));

            console.log('📋 Loaded barbers with usernames:', barbers.map(b => `${b.name} (${b.username})`));

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

    static async getBarberByPhone(phone) {
        try {
            await dbConnect();
            const barber = await Barber.findOne({ phone: phone });
            return barber;
        } catch (error) {
            console.error('Error getting barber by phone:', error);
            return null;
        }
    }

    static async addBarber(barberData) {
        try {
            await dbConnect();
            const barber = new Barber(barberData);
            const savedBarber = await barber.save();
            console.log('✅ Barber saved to MongoDB:', savedBarber._id);
            return savedBarber;
        } catch (error) {
            console.error('Error saving barber:', error);
            throw error;
        }
    }

    static async updateBarber(barberId, updateData) {
        try {
            await dbConnect();
            const updatedBarber = await Barber.findByIdAndUpdate(barberId, updateData, { new: true });
            console.log('✅ Barber updated in MongoDB:', barberId);
            return updatedBarber;
        } catch (error) {
            console.error('Error updating barber:', error);
            throw error;
        }
    }

    // Booking operations
    static async getAllBookings() {
        try {
            await dbConnect();
            // Get all bookings (no sorting in query to avoid field name issues)
            const bookings = await Booking.find();

            // Add id field for compatibility and sort in JavaScript (handles both created_at and createdAt)
            return bookings.map(booking => ({
                ...booking.toObject(),
                id: booking._id.toString()
            })).sort((a, b) => {
                // Sort by creation time (try both field names)
                const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
                const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
                if (bTime !== aTime) return bTime - aTime;

                // Then by date
                if (b.date_key !== a.date_key) return b.date_key.localeCompare(a.date_key);

                // Then by start time
                return b.start_time.localeCompare(a.start_time);
            });
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
            console.log('🔍 [MongoDB] Searching for barber:', barberName);

            // Get all bookings for this barber (no sorting in query to avoid field name issues)
            const bookings = await Booking.find({ barber: barberName });

            console.log('🔍 [MongoDB] Found', bookings.length, 'bookings for', barberName);
            if (bookings.length > 0) {
                console.log('🔍 [MongoDB] Sample booking:', {
                    barber: bookings[0].barber,
                    user: bookings[0].user_name,
                    date: bookings[0].date_key,
                    has_created_at: !!bookings[0].created_at,
                    has_createdAt: !!bookings[0].createdAt
                });
            }

            // Add id field for compatibility and sort in JavaScript (handles both created_at and createdAt)
            const result = bookings.map(booking => ({
                ...booking.toObject(),
                id: booking._id.toString()
            })).sort((a, b) => {
                // Sort by creation time (try both field names)
                const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
                const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
                if (bTime !== aTime) return bTime - aTime;

                // Then by date
                if (b.date_key !== a.date_key) return b.date_key.localeCompare(a.date_key);

                // Then by start time
                return b.start_time.localeCompare(a.start_time);
            });

            console.log('🔍 [MongoDB] Returning', result.length, 'bookings after sort');
            return result;
        } catch (error) {
            console.error('Error getting bookings by barber:', error);
            return [];
        }
    }

    static async getBookingsByDate(dateKey) {
        try {
            await dbConnect();
            const bookings = await Booking.find({ date_key: dateKey }).sort({ start_time: 1 });
            // Add id field for compatibility with frontend
            return bookings.map(booking => ({
                ...booking.toObject(),
                id: booking._id.toString()
            }));
        } catch (error) {
            console.error('Error getting bookings by date:', error);
            return [];
        }
    }

    static async deleteBooking(bookingId) {
        try {
            await dbConnect();
            const result = await Booking.findByIdAndDelete(bookingId);
            if (result) {
                console.log('✅ Booking deleted from MongoDB:', bookingId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting booking:', error);
            return false;
        }
    }

    static async updateBookingStatus(bookingId, status, notes) {
        try {
            await dbConnect();
            console.log('🔧 [MongoDB] Updating booking:', { bookingId, status, notes });

            const updateData = {
                status,
                updated_at: new Date(),
                updatedAt: new Date() // Update both field formats
            };
            if (notes !== undefined) {
                updateData.notes = notes;
            }

            console.log('🔧 [MongoDB] Update data:', updateData);

            const result = await Booking.findByIdAndUpdate(
                bookingId,
                updateData,
                { new: true }
            );

            if (result) {
                console.log('✅ [MongoDB] Booking status updated successfully');
                console.log('✅ [MongoDB] New status:', result.status);
                return result;
            } else {
                console.error('❌ [MongoDB] Booking not found with ID:', bookingId);
            }
            return null;
        } catch (error) {
            console.error('❌ [MongoDB] Error updating booking status:', error);
            console.error('❌ [MongoDB] Error details:', error.message);
            return null;
        }
    }

    static async updateBooking(bookingId, updateData) {
        try {
            await dbConnect();
            const result = await Booking.findByIdAndUpdate(
                bookingId,
                { ...updateData, updated_at: new Date() },
                { new: true }
            );
            if (result) {
                console.log('✅ Booking updated in MongoDB:', bookingId);
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error updating booking:', error);
            return null;
        }
    }

    // User authentication operations
    static async getUserByUsername(username) {
        try {
            await dbConnect();
            console.log('🔍 [MongoDB] Searching for username:', username);
            const user = await User.findOne({ username: username });
            console.log('🔍 [MongoDB] User query result:', !!user);
            if (user) {
                console.log('🔍 [MongoDB] Found user:', {
                    username: user.username,
                    name: user.name,
                    role: user.role
                });
            }
            return user;
        } catch (error) {
            console.error('Error getting user by username:', error);
            return null;
        }
    }

    static async findUserByPhone(phone) {
        try {
            await dbConnect();
            // Search in both username field (for regular users) and phone field (for barbers)
            const user = await User.findOne({
                $or: [
                    { username: phone },
                    { phone: phone }
                ]
            });
            return user;
        } catch (error) {
            console.error('Error getting user by phone:', error);
            return null;
        }
    }

    static async findBarberByPhone(phone) {
        try {
            await dbConnect();
            // Find barber by phone number
            const barber = await User.findOne({
                phone: phone,
                role: 'barber'
            });
            console.log('🔍 Barber search result for phone', phone, ':', barber ? 'Found' : 'Not found');
            return barber;
        } catch (error) {
            console.error('Error getting barber by phone:', error);
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

    static async getUserById(userId) {
        try {
            await dbConnect();
            const user = await User.findById(userId);
            return user;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
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

    static async updateUser(userId, updateData) {
        try {
            await dbConnect();
            const result = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true }
            );
            if (result) {
                console.log('✅ User updated in MongoDB:', userId);
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error updating user:', error);
            return null;
        }
    }

    static async createUser(userData) {
        try {
            await dbConnect();
            const user = new User(userData);
            const savedUser = await user.save();
            console.log('✅ User created in MongoDB:', savedUser._id);
            return {
                success: true,
                user: savedUser
            };
        } catch (error) {
            console.error('Error creating user:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async deleteUser(userId) {
        try {
            await dbConnect();
            const result = await User.findByIdAndDelete(userId);
            if (result) {
                console.log('✅ User deleted from MongoDB:', userId);
                return {
                    success: true
                };
            } else {
                return {
                    success: false,
                    error: 'کاربر یافت نشد'
                };
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async updateBarberAvailability(barberIdentifier, availability) {
        try {
            await dbConnect();

            console.log('🔍 Searching for barber:', barberIdentifier);
            console.log('📝 Availability to save:', JSON.stringify(availability, null, 2));

            // Find barber by username or name
            let user = await User.findOne({ username: barberIdentifier });
            if (!user) {
                console.log('⚠️ User not found by username, trying by name...');
                const barber = await Barber.findOne({ name: barberIdentifier });
                if (barber) {
                    console.log('✅ Found barber record:', barber._id);
                    user = await User.findOne({ barber_id: barber._id });
                }
            }

            if (!user) {
                console.error('❌ User not found for barber:', barberIdentifier);
                return { success: false, message: 'آرایشگر یافت نشد' };
            }

            console.log('✅ Found user:', user._id, 'Name:', user.name);
            console.log('📊 Current availability:', JSON.stringify(user.availability, null, 2));

            // Update availability using direct assignment with markModified
            user.availability = availability;
            user.markModified('availability');
            const result = await user.save();

            if (result) {
                console.log('✅ Barber availability updated successfully');
                console.log('📊 New availability:', JSON.stringify(result.availability, null, 2));
                return { success: true, user: result };
            }

            return { success: false, message: 'خطا در به‌روزرسانی' };
        } catch (error) {
            console.error('❌ Error updating barber availability:', error);
            return { success: false, message: 'خطا در پایگاه داده' };
        }
    }

    // Generate a secure random password
    static generateSecurePassword(username) {
        // Generate a stronger password with random characters
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        const randomPart = Array.from({ length: 8 }, () =>
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
        return `${username}_${randomPart}`;
    }

    // Initialize barber authentication accounts
    static async initializeBarberAuth() {
        try {
            await dbConnect();
            console.log('🔧 Initializing barber authentication...');

            // Get all active barbers from your existing data
            const barbers = await Barber.find({ isActive: true });
            const createdAccounts = [];

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

                    // Generate a secure password
                    const securePassword = this.generateSecurePassword(username);

                    // Create user account for barber
                    const userData = {
                        username: username,
                        name: barber.name,
                        password: securePassword,
                        role: 'barber',
                        barber_id: barber._id
                    };

                    await this.addUser(userData);
                    console.log(`✅ Created auth account for barber: ${barber.name} (${username})`);
                    console.log(`   Password: ${securePassword}`);

                    createdAccounts.push({
                        username: username,
                        name: barber.name,
                        password: securePassword
                    });
                } else {
                    console.log(`ℹ️ Auth account already exists for: ${barber.name}`);
                }
            }

            console.log('✅ Barber authentication initialization completed');

            // Return created accounts for reference
            return createdAccounts;

        } catch (error) {
            console.error('Error initializing barber authentication:', error);
            throw error;
        }
    }
}

export default MongoDatabase;
