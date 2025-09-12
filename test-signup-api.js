// Test signup API directly
async function testSignupAPI() {
    console.log('🧪 Testing Signup API...');
    
    try {
        const testUser = {
            first_name: 'تست',
            last_name: 'کاربر جدید', 
            phone: '09111111111',
            password: 'test123456',
            otp: '1234'
        };
        
        console.log('Sending signup request...');
        const response = await fetch('http://localhost:3000/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });
        
        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(result, null, 2));
        
        if (response.ok) {
            console.log('✅ Signup API working!');
        } else {
            console.log('❌ Signup API failed:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error testing signup API:', error.message);
    }
}

// Add delay to allow server to start
setTimeout(testSignupAPI, 2000);
