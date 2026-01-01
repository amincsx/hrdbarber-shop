// Test Melipayamak API connectivity
const testMelipayamak = async () => {
    console.log('🧪 Testing Melipayamak API...');

    // Test custom message API
    try {
        const response = await fetch('https://console.melipayamak.com/api/send/simple/25085e67e97342aa886f9fdf12117341', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: '50002710054227',
                to: '09123456789', // Test phone number
                text: 'Test message from HRD Barber Shop'
            })
        });

        console.log('Custom SMS API Response:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('Custom SMS API Result:', result);
        } else {
            console.error('Custom SMS API failed');
        }

    } catch (error) {
        console.error('Custom SMS API error:', error.message);
    }

    // Test OTP API
    try {
        const otpResponse = await fetch('https://console.melipayamak.com/api/send/otp/25085e67e97342aa886f9fdf12117341', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: '09123456789',
                bodyId: 194445,
                args: ['123456']
            })
        });

        console.log('OTP API Response:', otpResponse.status, otpResponse.statusText);

        if (otpResponse.ok) {
            const otpResult = await otpResponse.json();
            console.log('OTP API Result:', otpResult);
        } else {
            console.error('OTP API failed');
        }

    } catch (error) {
        console.error('OTP API error:', error.message);
    }
};

// Run the test
testMelipayamak();