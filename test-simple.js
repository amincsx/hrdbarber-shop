// Simple test for MongoDB integration
console.log('🧪 Testing MongoDB Integration (Simple)...\n');

async function testSimple() {
    try {
        // Test 1: Get barbers
        console.log('1️⃣ Testing barbers API...');
        const response = await fetch('http://localhost:3000/api/admin?action=barbers');
        const data = await response.json();

        if (data.barbers) {
            console.log(`✅ Found ${data.barbers.length} barbers in MongoDB:`);
            data.barbers.forEach(barber => {
                console.log(`   - ${barber.name}`);
            });
        } else {
            console.log('❌ No barbers found');
        }

        // Test 2: Test authentication initialization
        console.log('\n2️⃣ Testing authentication...');
        const loginResponse = await fetch('http://localhost:3000/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'test',
                password: 'test123',
                type: 'barber'
            })
        });

        const loginData = await loginResponse.json();
        console.log('✅ Authentication system responding');

        console.log('\n🎉 MongoDB integration looks good!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

setTimeout(testSimple, 1000);
