// Check Melipayamak account status and try different approaches
const testSMSMethods = async () => {
    console.log('🧪 Testing different SMS methods...');

    const testPhone = '09123456789';
    const testMessage = 'تست پیام از آرایشگاه HRD - رزرو شما تایید شد!';

    // Method 1: Simple API with different sender numbers
    console.log('\n📱 Method 1: Simple API with original sender');
    try {
        const response1 = await fetch('https://console.melipayamak.com/api/send/simple/25085e67e97342aa886f9fdf12117341', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: '50002710054227',
                to: testPhone,
                text: testMessage
            })
        });

        const result1 = await response1.json();
        console.log('Result:', result1);
    } catch (e) {
        console.error('Error:', e.message);
    }

    // Method 2: Simple API with default sender (empty from)
    console.log('\n📱 Method 2: Simple API without sender');
    try {
        const response2 = await fetch('https://console.melipayamak.com/api/send/simple/25085e67e97342aa886f9fdf12117341', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: testPhone,
                text: testMessage
            })
        });

        const result2 = await response2.json();
        console.log('Result:', result2);
    } catch (e) {
        console.error('Error:', e.message);
    }

    // Method 3: Try different sender number
    console.log('\n📱 Method 3: Simple API with different sender');
    try {
        const response3 = await fetch('https://console.melipayamak.com/api/send/simple/25085e67e97342aa886f9fdf12117341', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: '10008663', // Original sender from setup
                to: testPhone,
                text: testMessage
            })
        });

        const result3 = await response3.json();
        console.log('Result:', result3);
    } catch (e) {
        console.error('Error:', e.message);
    }

    // Method 4: Check if we can create a custom template
    console.log('\n📱 Method 4: Testing shorter message');
    try {
        const shortMessage = 'رزرو تایید شد - آرایشگاه HRD';
        const response4 = await fetch('https://console.melipayamak.com/api/send/simple/25085e67e97342aa886f9fdf12117341', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: '50002710054227',
                to: testPhone,
                text: shortMessage
            })
        });

        const result4 = await response4.json();
        console.log('Result:', result4);
    } catch (e) {
        console.error('Error:', e.message);
    }
};

testSMSMethods();