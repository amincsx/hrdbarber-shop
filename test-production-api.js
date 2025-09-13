// 🧪 PRODUCTION API TESTING SCRIPT
// Test your production API endpoints directly

const PRODUCTION_URL = 'https://your-app.liara.run'; // Replace with your actual production URL

async function testProductionAPI() {
    console.log('🧪 TESTING PRODUCTION API ENDPOINTS');
    console.log('=====================================\n');

    const testCases = [
        {
            name: 'Login Test - user/pass',
            url: `${PRODUCTION_URL}/api/auth?phone=user&password=pass`,
            method: 'GET'
        },
        {
            name: 'Login Test - ceo/instad',
            url: `${PRODUCTION_URL}/api/auth?phone=ceo&password=instad`,
            method: 'GET'
        },
        {
            name: 'Signup Test',
            url: `${PRODUCTION_URL}/api/auth`,
            method: 'POST',
            body: {
                first_name: 'Test',
                last_name: 'User',
                phone: '09123456789',
                password: 'testpass123'
            }
        }
    ];

    for (const test of testCases) {
        console.log(`\n🔍 Testing: ${test.name}`);
        console.log(`URL: ${test.url}`);
        
        try {
            const options = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const response = await fetch(test.url, options);
            const data = await response.json();

            if (response.ok) {
                console.log(`✅ SUCCESS (${response.status}):`, data);
            } else {
                console.log(`❌ FAILED (${response.status}):`, data);
            }

        } catch (error) {
            console.log(`❌ ERROR:`, error.message);
        }
    }

    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Replace "your-app.liara.run" with your actual production URL');
    console.log('2. Run this script: node test-production-api.js');
    console.log('3. Check the results to identify which endpoints are failing');
    console.log('4. If all tests fail, the issue is likely MONGODB_URI or database connection');
}

testProductionAPI();
