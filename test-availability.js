// Test script to verify availability data persistence
const https = require('https');
const http = require('http');

const baseUrl = 'http://localhost:3000';
const barberId = 'amin';

// Simple fetch implementation
function fetchData(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ json, status: res.statusCode });
                } catch (error) {
                    resolve({ text: data, status: res.statusCode });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function testAvailabilityPersistence() {
    console.log('🧪 Testing availability persistence for barber:', barberId);

    try {
        // 1. First check current availability
        console.log('\n📥 Step 1: Getting current availability...');
        const getResponse = await fetchData(`${baseUrl}/api/barber/availability?barberId=${barberId}`);
        console.log('Current availability:', JSON.stringify(getResponse.json, null, 2));

        // 2. Save some test availability settings
        console.log('\n💾 Step 2: Saving test availability settings...');
        const testAvailability = {
            workingHours: { start: 9, end: 20 },
            lunchBreak: { start: 13, end: 14 },
            offDays: ['دوشنبه', 'سه‌شنبه'], // Monday and Tuesday off
            offHours: [{ start: '15:00', end: '16:00', date: '' }], // 3-4 PM off daily
            isAvailable: true
        };

        const saveResponse = await fetchData(`${baseUrl}/api/barber/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                barberId: barberId,
                availability: testAvailability
            })
        });

        console.log('Save result:', JSON.stringify(saveResponse.json, null, 2));

        if (!saveResponse.json.success) {
            console.error('❌ Failed to save availability!');
            return;
        }

        // 3. Fetch the data again to verify persistence
        console.log('\n📥 Step 3: Verifying data was saved...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const verifyResponse = await fetchData(`${baseUrl}/api/barber/availability?barberId=${barberId}&t=${Date.now()}`);
        console.log('Verified availability:', JSON.stringify(verifyResponse.json, null, 2));

        // 4. Compare the data
        console.log('\n🔍 Step 4: Comparing saved vs loaded data...');
        if (verifyResponse.json.success && verifyResponse.json.availability) {
            const saved = testAvailability;
            const loaded = verifyResponse.json.availability;

            console.log('✅ Working hours match:',
                saved.workingHours.start === loaded.workingHours.start &&
                saved.workingHours.end === loaded.workingHours.end
            );

            console.log('✅ Lunch break match:',
                saved.lunchBreak.start === loaded.lunchBreak.start &&
                saved.lunchBreak.end === loaded.lunchBreak.end
            );

            console.log('✅ Off days match:',
                JSON.stringify(saved.offDays) === JSON.stringify(loaded.offDays)
            );

            console.log('✅ Off hours match:',
                JSON.stringify(saved.offHours) === JSON.stringify(loaded.offHours)
            );

            console.log('✅ Availability status match:',
                saved.isAvailable === loaded.isAvailable
            );

            console.log('\n🎉 Test completed successfully!');
        } else {
            console.error('❌ Failed to load saved availability data!');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testAvailabilityPersistence();