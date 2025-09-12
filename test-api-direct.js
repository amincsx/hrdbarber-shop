import { SimpleFileDB } from './src/lib/fileDatabase.js';

console.log("🔧 Testing API logic directly...");

// Test the exact same logic as the API endpoint
const barberId = "حمید";
console.log("Testing with barber:", barberId);

try {
    const bookings = SimpleFileDB.getBookingsByBarber(barberId);
    console.log(`✅ Found ${bookings.length} bookings for ${barberId}:`);
    
    bookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.user_name} - ${booking.date_key} ${booking.start_time}-${booking.end_time}`);
    });
    
    // Test URL encoding/decoding
    const encoded = encodeURIComponent(barberId);
    const decoded = decodeURIComponent(encoded);
    
    console.log("\n🔍 URL Encoding Test:");
    console.log("Original:", barberId);
    console.log("Encoded:", encoded);
    console.log("Decoded:", decoded);
    console.log("Match?", barberId === decoded);
    
} catch (error) {
    console.error("❌ Error:", error.message);
}
