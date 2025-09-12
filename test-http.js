// Test making HTTP request to barber API
const barberId = "حمید";
const encodedBarberId = encodeURIComponent(barberId);
const apiUrl = `http://localhost:3001/api/barber/${encodedBarberId}`;

console.log("Making HTTP request to:", apiUrl);

// Using node-fetch equivalent with native fetch
import('node-fetch').then(({ default: fetch }) => {
    return fetch(apiUrl);
}).then(response => {
    console.log("Response status:", response.status);
    return response.json();
}).then(data => {
    console.log("API Response:", JSON.stringify(data, null, 2));
}).catch(error => {
    console.error("Request failed:", error.message);
});
