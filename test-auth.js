// Test authentication API
console.log('🧪 Testing Authentication API...\n');

async function testAuth() {
    try {
        // Test the auth endpoint
        const testCredentials = [
            { phone: 'user', password: 'pass' },
            { phone: 'ceo', password: 'instad' }
        ];

        for (const creds of testCredentials) {
            console.log(`Testing login: ${creds.phone} / ${creds.password}`);

            const response = await fetch(`http://localhost:3000/api/auth?phone=${creds.phone}&password=${creds.password}`);
            const data = await response.json();

            console.log(`Status: ${response.status}`);
            console.log(`Response:`, data);

            if (response.ok) {
                console.log(`✅ Login successful for ${creds.phone}`);
            } else {
                console.log(`❌ Login failed for ${creds.phone}: ${data.error}`);
            }
            console.log('---');
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Wait for server to be ready
setTimeout(testAuth, 3000);
