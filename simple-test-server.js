const http = require('http');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World - Test Server Running!');
});

// Listen on port 3002
const PORT = 3002;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

// Keep the server running for 30 seconds
console.log('Server will run for 30 seconds');
setTimeout(() => {
  console.log('Shutting down test server');
  server.close();
}, 30000);
