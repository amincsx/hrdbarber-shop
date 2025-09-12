// Test the auth API endpoint directly
async function testWebAuth() {
    console.log('🌐 Testing Web Authentication API...');
    
    try {
        // Test 1: user/pass login
        console.log('\n1️⃣ Testing GET /api/auth?phone=user&password=pass');
        const response1 = await fetch('http://localhost:3000/api/auth?phone=user&password=pass');
        const data1 = await response1.json();
        console.log('Response status:', response1.status);
        console.log('Response data:', JSON.stringify(data1, null, 2));
        
        // Test 2: ceo/instad login
        console.log('\n2️⃣ Testing GET /api/auth?phone=ceo&password=instad');
        const response2 = await fetch('http://localhost:3000/api/auth?phone=ceo&password=instad');
        const data2 = await response2.json();
        console.log('Response status:', response2.status);
        console.log('Response data:', JSON.stringify(data2, null, 2));
        
        // Test 3: Invalid credentials
        console.log('\n3️⃣ Testing invalid credentials');
        const response3 = await fetch('http://localhost:3000/api/auth?phone=invalid&password=invalid');
        const data3 = await response3.json();
        console.log('Response status:', response3.status);
        console.log('Response data:', JSON.stringify(data3, null, 2));
        
    } catch (error) {
        console.error('❌ Error testing web auth:', error.message);
    }
}

// Add delay to allow server to start
setTimeout(testWebAuth, 2000);
