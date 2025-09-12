// Complete Test Credentials for Local Development

function displayAllTestCredentials() {
    console.log('🎉 ALL TEST CREDENTIALS FOR LOCAL DEVELOPMENT');
    console.log('=============================================');
    
    console.log('👤 REGULAR USER (Signup/Login pages):');
    console.log('📱 Phone: 09123456789');
    console.log('🔑 Password: 1234');
    console.log('👤 Name: کاربر تست');
    console.log('🌐 Access: User dashboard, booking');
    console.log('');
    
    console.log('👑 OWNER ADMIN (Admin page):');
    console.log('👤 Username: owner');
    console.log('🔑 Password: owner123');
    console.log('🌐 Access: /admin page (full admin access)');
    console.log('');
    
    console.log('✂️ BARBERS (Admin page):');
    console.log('👤 حمید: username: hamid, password: barber123');
    console.log('👤 بنیامین: username: benyamin, password: barber123');
    console.log('👤 محمد: username: mohammad, password: barber123');
    console.log('🌐 Access: /admin page (barber dashboard)');
    console.log('');
    
    console.log('📋 HOW TO TEST:');
    console.log('1. Regular User: Go to /signup or /login with phone number');
    console.log('2. Admin/Barbers: Go to /admin page directly');
    console.log('3. Use credentials above for testing');
    console.log('4. All authentication works locally without database');
    console.log('');
    
    console.log('🚀 READY TO PUSH TO REPOSITORY!');
    
    return {
        regularUser: {
            phone: '09123456789',
            password: '1234',
            name: 'کاربر تست',
            access: 'user dashboard, booking'
        },
        owner: {
            username: 'owner',
            password: 'owner123',
            type: 'owner',
            access: 'full admin access'
        },
        barbers: [
            { username: 'hamid', password: 'barber123', name: 'حمید', access: 'barber dashboard' },
            { username: 'benyamin', password: 'barber123', name: 'بنیامین', access: 'barber dashboard' },
            { username: 'mohammad', password: 'barber123', name: 'محمد', access: 'barber dashboard' }
        ]
    };
}

// Run the script to display credentials
displayAllTestCredentials();
