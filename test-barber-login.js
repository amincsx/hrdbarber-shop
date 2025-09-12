// Test script for barber login functionality
console.log('🧪 Testing Barber Login System...\n');

// Test data for barber login
const testLogins = [
    { username: 'hamid', password: 'hamid123', expected: true },
    { username: 'benyamin', password: 'benyamin123', expected: true },
    { username: 'mohammad', password: 'mohammad123', expected: true },
    { username: 'hamid', password: 'wrongpassword', expected: false },
    { username: 'nonexistent', password: 'hamid123', expected: false }
];

async function testBarberLogin(username, password, shouldSucceed) {
    try {
        console.log(`Testing login: ${username} / ${password}`);
        
        const response = await fetch('http://localhost:3000/api/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                type: 'barber'
            })
        });

        const data = await response.json();
        
        if (shouldSucceed) {
            if (data.success) {
                console.log(`✅ SUCCESS: ${data.user.name} logged in successfully`);
                console.log(`   User ID: ${data.user.id}`);
                console.log(`   Username: ${data.user.username}`);
            } else {
                console.log(`❌ FAILED: Expected success but got: ${data.error}`);
            }
        } else {
            if (!data.success) {
                console.log(`✅ CORRECTLY REJECTED: ${data.error}`);
            } else {
                console.log(`❌ FAILED: Expected rejection but login succeeded`);
            }
        }
        
        console.log('---');
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        console.log('---');
    }
}

async function runTests() {
    // Wait for server to be ready
    console.log('Waiting for server to be ready...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    for (const test of testLogins) {
        await testBarberLogin(test.username, test.password, test.expected);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🏁 Test completed!');
}

runTests();
