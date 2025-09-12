const http = require('http');

function testSignup() {
    const uniquePhone = '0912' + Date.now().toString().slice(-7);

    const postData = JSON.stringify({
        first_name: 'تست',
        last_name: 'کاربر',
        phone: uniquePhone,
        password: 'test123456',
        otp: '1234'
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('🧪 Testing signup with phone:', uniquePhone);
    console.log('📤 Sending request...');

    const req = http.request(options, (res) => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        console.log(`📋 Headers:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('📨 Response Body:');
            try {
                const response = JSON.parse(data);
                console.log(JSON.stringify(response, null, 2));
            } catch (e) {
                console.log(data);
            }

            if (res.statusCode === 200) {
                console.log('✅ Signup successful! Now testing login...');
                testLogin(uniquePhone, 'test123456');
            } else {
                console.log('❌ Signup failed');
                process.exit(1);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Request error: ${e.message}`);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

function testLogin(phone, password) {
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/auth?phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`,
        method: 'GET'
    };

    console.log('\n🔐 Testing login with created user...');

    const req = http.request(options, (res) => {
        console.log(`📊 Login Status Code: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('📨 Login Response:');
            try {
                const response = JSON.parse(data);
                console.log(JSON.stringify(response, null, 2));
            } catch (e) {
                console.log(data);
            }

            if (res.statusCode === 200) {
                console.log('✅ Complete test passed: Signup + Login successful!');
                console.log('🎉 User was created and can login - MongoDB is working correctly!');
            } else {
                console.log('❌ Login failed - user may not have been saved to MongoDB');
            }
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Login request error: ${e.message}`);
        process.exit(1);
    });

    req.end();
}

// Wait a bit for server to be ready, then test
setTimeout(testSignup, 2000);
