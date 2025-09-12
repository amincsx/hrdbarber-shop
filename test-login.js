// Test barber login API
const testBarberLogin = async () => {
    const loginData = {
        username: 'hamid',
        password: 'barber123',
        type: 'barber'
    };

    console.log('Testing barber login with:', loginData);

    try {
        const response = await fetch('http://localhost:3001/api/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', result);

        if (response.ok && result.success) {
            console.log('✅ Login successful!');
            console.log('User data:', result.user);
            console.log('Redirect URL should be:', `/admin/barber/${encodeURIComponent(result.user.name)}`);
        } else {
            console.log('❌ Login failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
};

testBarberLogin();
