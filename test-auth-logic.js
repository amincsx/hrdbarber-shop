import MongoDatabase from './src/lib/mongoDatabase.js';

async function testAuthLogic() {
    console.log('🔐 Testing authentication logic...');
    
    try {
        // Test authentication for user/pass
        console.log('\n1️⃣ Testing user/pass authentication...');
        const user1 = await MongoDatabase.findUserByPhone('user');
        if (user1 && user1.password === 'pass') {
            console.log('✅ user/pass authentication successful');
            console.log('   User:', user1.name, '| Role:', user1.role);
        } else {
            console.log('❌ user/pass authentication failed');
        }
        
        // Test authentication for ceo/instad
        console.log('\n2️⃣ Testing ceo/instad authentication...');
        const user2 = await MongoDatabase.findUserByPhone('ceo');
        if (user2 && user2.password === 'instad') {
            console.log('✅ ceo/instad authentication successful');
            console.log('   User:', user2.name, '| Role:', user2.role);
        } else {
            console.log('❌ ceo/instad authentication failed');
        }
        
        // Test getting all barbers
        console.log('\n3️⃣ Testing barber data...');
        const barbers = await MongoDatabase.getAllBarbers();
        console.log('✅ Found', barbers.length, 'barbers:');
        barbers.forEach(barber => {
            console.log(`   - ${barber.name}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    process.exit(0);
}

testAuthLogic();
