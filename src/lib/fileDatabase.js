// Simple file-based database for bookings
import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DB_DIR, 'bookings.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

export class SimpleFileDB {
    static readBookings() {
        try {
            const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading bookings:', error);
            return [];
        }
    }

    static writeBookings(bookings) {
        try {
            fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing bookings:', error);
            return false;
        }
    }

    static addBooking(booking) {
        try {
            const bookings = this.readBookings();
            const newBooking = {
                ...booking,
                _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                status: booking.status || 'confirmed'
            };
            bookings.push(newBooking);
            
            if (this.writeBookings(bookings)) {
                console.log('✅ Booking saved to file database:', newBooking._id);
                return newBooking;
            }
            return null;
        } catch (error) {
            console.error('Error adding booking:', error);
            return null;
        }
    }

    static getAllBookings() {
        return this.readBookings();
    }

    static getBookingsByDate(dateKey) {
        const bookings = this.readBookings();
        return bookings.filter(booking => booking.date_key === dateKey);
    }

    static getBookingsByUser(userId) {
        const bookings = this.readBookings();
        return bookings.filter(booking => 
            booking.user_id === userId || 
            booking.user_phone === userId ||
            booking.phone === userId
        );
    }

    static getBookingsByBarber(barberName) {
        const bookings = this.readBookings();
        return bookings.filter(booking => booking.barber === barberName);
    }

    static updateBooking(bookingId, updates) {
        try {
            const bookings = this.readBookings();
            const bookingIndex = bookings.findIndex(b => b._id === bookingId || b.id === bookingId);
            
            if (bookingIndex !== -1) {
                bookings[bookingIndex] = {
                    ...bookings[bookingIndex],
                    ...updates,
                    updated_at: new Date().toISOString()
                };
                
                if (this.writeBookings(bookings)) {
                    console.log('✅ Booking updated:', bookingId);
                    return bookings[bookingIndex];
                }
            }
            return null;
        } catch (error) {
            console.error('Error updating booking:', error);
            return null;
        }
    }

    static deleteBooking(bookingId) {
        try {
            const bookings = this.readBookings();
            const filteredBookings = bookings.filter(b => b._id !== bookingId && b.id !== bookingId);
            
            if (this.writeBookings(filteredBookings)) {
                console.log('✅ Booking deleted:', bookingId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting booking:', error);
            return false;
        }
    }

    static getBookingById(bookingId) {
        const bookings = this.readBookings();
        return bookings.find(b => b._id === bookingId || b.id === bookingId);
    }

    // Check for booking conflicts
    static hasConflict(dateKey, startTime, endTime, barber, excludeBookingId = null) {
        const bookings = this.getBookingsByDate(dateKey);
        
        return bookings.some(booking => {
            // Skip the booking we're updating
            if (excludeBookingId && (booking._id === excludeBookingId || booking.id === excludeBookingId)) {
                return false;
            }
            
            // Only check same barber
            if (booking.barber !== barber) return false;
            
            // Skip cancelled bookings
            if (booking.status === 'cancelled') return false;
            
            const existingStart = booking.start_time;
            const existingEnd = booking.end_time;
            
            return (
                (startTime >= existingStart && startTime < existingEnd) ||
                (endTime > existingStart && endTime <= existingEnd) ||
                (startTime <= existingStart && endTime >= existingEnd)
            );
        });
    }
}
