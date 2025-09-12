// Test signup process and MongoDB saving
async function testSignupProcess() {
    console.log('🧪 Testing Signup Process...');

    const testUser = {
        first_name: 'تست',
        last_name: 'کاربر جدید',
        phone: `0912${Date.now().toString().slice(-7)}`, // Use truly unique number
        password: 'test123456',
        otp: '1234'
    };

    try {
        console.log('1️⃣ Sending signup request...');
        console.log('Test user data:', testUser);

        const response = await fetch('http://localhost:3001/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));

        const result = await response.json();
        console.log('Response data:', JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log('✅ Signup API returned success');

            // Now check if user actually exists in database
            console.log('\n2️⃣ Checking if user was saved to database...');
            const checkResponse = await fetch(`http://localhost:3001/api/auth?phone=${testUser.phone}&password=${testUser.password}`);
            const checkResult = await checkResponse.json();

            if (checkResponse.ok) {
                console.log('✅ User found in database after signup!');
                console.log('User data:', JSON.stringify(checkResult, null, 2));
            } else {
                console.log('❌ User NOT found in database after signup!');
                console.log('This indicates the signup didn\'t actually save to MongoDB');
                console.log('Error:', checkResult);
            }
        } else {
            console.log('❌ Signup API failed');
            console.log('Error:', result);
        }

    } catch (error) {
        console.error('❌ Error during signup test:', error.message);
    }
}

// Run test after server starts
setTimeout(testSignupProcess, 3000);
