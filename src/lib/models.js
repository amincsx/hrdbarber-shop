import mongoose from 'mongoose';

// Barber Schema - matches your MongoDB Compass structure
const BarberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    specialties: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    schedule: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Added for authentication
    username: {
        type: String,
        unique: true,
        sparse: true, // Allow null values but unique when present
        trim: true
    },
    password: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Booking Schema - matches your booking system
const BookingSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        trim: true
    },
    date_key: {
        type: String,
        required: true,
        trim: true
    },
    start_time: {
        type: String,
        required: true,
        trim: true
    },
    end_time: {
        type: String,
        required: true,
        trim: true
    },
    barber: {
        type: String,
        required: true,
        trim: true
    },
    barber_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Barber'
    },
    services: [{
        type: String,
        trim: true
    }],
    total_duration: {
        type: Number,
        required: true
    },
    user_name: {
        type: String,
        required: true,
        trim: true
    },
    user_phone: {
        type: String,
        required: true,
        trim: true
    },
    persian_date: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled', 'completed'],
        default: 'confirmed'
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// User Schema - for admin/barber authentication
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        sparse: true // Optional field for regular users
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'barber', 'customer', 'user'],
        default: 'customer'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    barber_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Barber',
        sparse: true // Only for users who are barbers
    }
}, {
    timestamps: true
});

// Create or get existing models
const Barber = mongoose.models.Barber || mongoose.model('Barber', BarberSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export { Barber, Booking, User };
