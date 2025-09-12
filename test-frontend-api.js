// Test the exact API call that the frontend makes
const barberName = "حمید";
const encodedName = encodeURIComponent(barberName);

console.log("Testing frontend API call:");
console.log("Barber name:", barberName);
console.log("Encoded:", encodedName);
console.log("URL:", `http://localhost:3000/api/barber/${encodedName}`);

// Test with fetch (Node.js 18+ has built-in fetch)
if (typeof fetch !== 'undefined') {
    fetch(`http://localhost:3000/api/barber/${encodedName}`)
        .then(response => {
            console.log("Response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("API Response:", JSON.stringify(data, null, 2));
        })
        .catch(error => {
            console.error("Error:", error.message);
        });
} else {
    console.log("Fetch not available, using manual encoding test:");
    console.log("Manual decode test:", decodeURIComponent(encodedName) === barberName);
}
