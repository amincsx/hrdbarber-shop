// Script to create a test user for local development (localStorage version)

// Since database is not accessible locally, we'll create a test user
// that can be used with the signup/login flow

function createTestUserData() {
    const testUser = {
        firstName: 'کاربر',
        lastName: 'تست',
        phone: '09123456789',
        password: '1234'
    };

    console.log('🎉 Test User Created for Local Development');
    console.log('==========================================');
    console.log('📱 Phone Number: ' + testUser.phone);
    console.log('🔑 Password: ' + testUser.password);
    console.log('👤 Name: ' + testUser.firstName + ' ' + testUser.lastName);
    console.log('');
    console.log('📋 How to use:');
    console.log('1. Go to the signup page');
    console.log('2. Enter the above credentials');
    console.log('3. Use any 4-digit code for OTP verification');
    console.log('4. Or go directly to login page and use these credentials');
    console.log('');
    console.log('� Note: This user will be stored in localStorage when you signup/login');
    
    return testUser;
}

// Also create a function to directly store in localStorage (for browser console)
function storeTestUserInBrowser() {
    const userData = {
        firstName: 'کاربر',
        lastName: 'تست', 
        phone: '09123456789',
        name: 'کاربر تست'
    };
    
    console.log('To store this user in browser localStorage, run this in browser console:');
    console.log('localStorage.setItem("userData", \'' + JSON.stringify(userData) + '\');');
}

// Run the script
const testUser = createTestUserData();
storeTestUserInBrowser();
