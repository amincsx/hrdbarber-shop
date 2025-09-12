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

    console.log('🧪 Testing signup with phone:', uniquePhone);
    console.log('📤 Sending request to http://localhost:3001/api/auth...');

    // Test server connectivity first
    const pingReq = http.get('http://localhost:3001', (res) => {
        console.log(`Server ping successful - Status code: ${res.statusCode}`);
        console.log('Proceeding with signup test...\n');

        // If ping works, try the actual signup
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 10000 // 10 seconds timeout
        };

        const req = http.request(options, (res) => {
            console.log(`📊 Status Code: ${res.statusCode}`);

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📨 Response Body:');
                try {
                    const response = JSON.parse(data);
                    console.log(JSON.stringify(response, null, 2));

                    if (res.statusCode === 200) {
                        console.log('✅ Signup successful!');
                        // Now let's verify user was actually saved to MongoDB by trying to login
                        testLogin(uniquePhone, 'test123456');
                    } else {
                        console.log('❌ Signup failed with status code:', res.statusCode);
                        process.exit(1);
                    }
                } catch (e) {
                    console.log('Raw response:', data);
                    console.error('Error parsing JSON response:', e.message);
                    process.exit(1);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Signup request error: ${e.message}`);
            console.log('Full error:', e);
            process.exit(1);
        });

        req.on('timeout', () => {
            console.error('❌ Request timed out after 10 seconds');
            req.destroy();
            process.exit(1);
        });

        // Write the post data and end the request
        req.write(postData);
        req.end();
    });

    pingReq.on('error', (e) => {
        console.error(`❌ Server ping failed: ${e.message}`);
        console.error('Cannot connect to development server at http://localhost:3001');
        console.error('Please make sure the server is running and accessible');
        console.error('Full error:', e);
        process.exit(1);
    });

    pingReq.on('timeout', () => {
        console.error('❌ Server ping timed out');
        pingReq.destroy();
        process.exit(1);
    });
}

function testLogin(phone, password) {
    console.log('\n🔐 Testing login with created user...');

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/auth?phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`,
        method: 'GET',
        timeout: 10000 // 10 seconds timeout
    };

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

                if (res.statusCode === 200) {
                    console.log('✅ Complete test passed: Signup + Login successful!');
                    console.log('🎉 User was created and can login - MongoDB is working correctly!');
                } else {
                    console.log('❌ Login failed - user may not have been saved to MongoDB');
                }
            } catch (e) {
                console.log('Raw response:', data);
                console.error('Error parsing JSON response:', e.message);
            }
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Login request error: ${e.message}`);
        console.error('Full error:', e);
        process.exit(1);
    });

    req.on('timeout', () => {
        console.error('❌ Login request timed out after 10 seconds');
        req.destroy();
        process.exit(1);
    });

    req.end();
}

// Wait for server to be fully ready
console.log('Waiting for server to be ready...');
setTimeout(testSignup, 3000);
