// Simple test server to simulate user authentication locally
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory test users (simulating database)
const testUsers = [
    {
        id: '1',
        phone: '09123456789',
        name: 'کاربر تست',
        firstName: 'کاربر',
        lastName: 'تست',
        role: 'user',
        isVerified: true,
        password: '1234' // In real app, this would be hashed
    }
];

// Test bookings storage
let testBookings = [];

// Login endpoint
app.put('/api/auth', (req, res) => {
    const { phone, password } = req.body;
    
    console.log('Login attempt:', { phone, password });
    
    const user = testUsers.find(u => u.phone === phone);
    
    if (!user) {
        return res.status(404).json({ error: 'کاربری با این شماره تلفن یافت نشد' });
    }
    
    if (password !== user.password && password.length < 4) {
        return res.status(401).json({ error: 'رمز عبور نامعتبر است' });
    }
    
    res.json({
        message: 'ورود موفقیت‌آمیز بود',
        user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified
        }
    });
});

// Register endpoint
app.post('/api/auth', (req, res) => {
    const { first_name, last_name, phone, password } = req.body;
    
    console.log('Registration attempt:', { first_name, last_name, phone });
    
    const existingUser = testUsers.find(u => u.phone === phone);
    
    if (existingUser) {
        return res.status(409).json({ error: 'کاربری با این شماره تلفن قبلاً ثبت نام کرده است' });
    }
    
    const newUser = {
        id: String(testUsers.length + 1),
        phone,
        name: `${first_name} ${last_name}`,
        firstName: first_name,
        lastName: last_name,
        role: 'user',
        isVerified: true,
        password
    };
    
    testUsers.push(newUser);
    
    res.json({
        message: 'ثبت نام با موفقیت انجام شد',
        user: {
            id: newUser.id,
            name: newUser.name,
            phone: newUser.phone,
            role: newUser.role,
            isVerified: newUser.isVerified
        }
    });
});

// Bookings endpoints
app.get('/api/bookings', (req, res) => {
    res.json(testBookings);
});

app.post('/api/bookings', (req, res) => {
    const booking = {
        ...req.body,
        _id: String(testBookings.length + 1),
        createdAt: new Date().toISOString()
    };
    
    testBookings.push(booking);
    console.log('New booking created:', booking);
    
    res.json({ success: true, booking });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Test server running',
        users: testUsers.length,
        bookings: testBookings.length
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log('📱 Test user: 09123456789');
    console.log('🔑 Password: 1234');
    console.log('🔗 Health check: http://localhost:3001/health');
});
