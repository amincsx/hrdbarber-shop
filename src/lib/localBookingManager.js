// Local booking management for development
// This file provides functions to work with localStorage bookings

export class LocalBookingManager {
    static getAllBookings() {
        try {
            const bookings = localStorage.getItem('allBookings');
            return bookings ? JSON.parse(bookings) : [];
        } catch (error) {
            console.error('Error reading localStorage bookings:', error);
            return [];
        }
    }

    static getBookingsByBarber(barberName) {
        const allBookings = this.getAllBookings();
        return allBookings.filter(booking => booking.barber === barberName);
    }

    static getBookingsByUser(userPhone) {
        const allBookings = this.getAllBookings();
        return allBookings.filter(booking =>
            booking.phone === userPhone ||
            booking.user_phone === userPhone ||
            booking.user_id === userPhone
        );
    }

    static getBookingsByDate(dateKey) {
        const allBookings = this.getAllBookings();
        return allBookings.filter(booking =>
            (booking.dateKey === dateKey) ||
            (booking.date_key === dateKey)
        );
    }

    static getTodayBookings() {
        const today = new Date().toISOString().split('T')[0];
        return this.getBookingsByDate(today);
    }

    static getBookingStats() {
        const allBookings = this.getAllBookings();
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        return {
            total: allBookings.length,
            today: allBookings.filter(b =>
                (b.dateKey === today || b.date_key === today)
            ).length,
            thisWeek: allBookings.filter(b => {
                const bookingDate = b.dateKey || b.date_key;
                return bookingDate >= weekAgoStr && bookingDate <= today;
            }).length
        };
    }

    static getBarberStats(barberName) {
        const barberBookings = this.getBookingsByBarber(barberName);
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        return {
            total: barberBookings.length,
            today: barberBookings.filter(b =>
                (b.dateKey === today || b.date_key === today)
            ).length,
            thisWeek: barberBookings.filter(b => {
                const bookingDate = b.dateKey || b.date_key;
                return bookingDate >= weekAgoStr && bookingDate <= today;
            }).length,
            pending: barberBookings.filter(b =>
                !b.status || b.status === 'pending'
            ).length
        };
    }

    static updateBookingStatus(bookingId, status, notes) {
        try {
            const allBookings = this.getAllBookings();
            const bookingIndex = allBookings.findIndex(b =>
                b.id === bookingId || b._id === bookingId
            );

            if (bookingIndex !== -1) {
                allBookings[bookingIndex].status = status;
                if (notes) {
                    allBookings[bookingIndex].notes = notes;
                }
                allBookings[bookingIndex].updated_at = new Date().toISOString();

                localStorage.setItem('allBookings', JSON.stringify(allBookings));
                return allBookings[bookingIndex];
            }
            return null;
        } catch (error) {
            console.error('Error updating booking status:', error);
            return null;
        }
    }

    static formatBookingForDisplay(booking) {
        // Normalize booking data for consistent display
        return {
            id: booking.id || booking._id,
            user_id: booking.phone || booking.user_phone || booking.user_id,
            user_name: booking.userName || booking.user_name || 'کاربر',
            user_phone: booking.phone || booking.user_phone || booking.user_id,
            date_key: booking.dateKey || booking.date_key,
            start_time: booking.startTime || booking.start_time,
            end_time: booking.endTime || booking.end_time,
            barber: booking.barber,
            services: booking.services || [],
            total_duration: booking.totalDuration || booking.total_duration,
            status: booking.status || 'confirmed',
            notes: booking.notes || '',
            created_at: booking.bookedAt || booking.created_at || new Date().toISOString(),
            updated_at: booking.updated_at
        };
    }
}
