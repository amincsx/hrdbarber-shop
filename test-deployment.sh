#!/bin/bash
# Comprehensive testing script for HRD Barber Shop

echo "🧪 Starting Comprehensive Local Testing..."

# 1. Build Test
echo "1️⃣ Testing Build Process..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - Fix errors before deploying"
    exit 1
fi

# 2. Start production server
echo "2️⃣ Starting production server..."
npm start &
SERVER_PID=$!
sleep 5

# 3. Test key endpoints
echo "3️⃣ Testing API endpoints..."

# Test authentication
echo "Testing authentication API..."
curl -s "http://localhost:3000/api/auth?phone=user&password=pass" | grep -q "success\|message" && echo "✅ Auth API working" || echo "❌ Auth API failed"

# Test admin API
echo "Testing admin API..."
curl -s "http://localhost:3000/api/admin?action=barbers" | grep -q "barbers" && echo "✅ Admin API working" || echo "❌ Admin API failed"

# 4. Test page loads
echo "4️⃣ Testing page loads..."
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/login" | grep -q "200" && echo "✅ Login page working" || echo "❌ Login page failed"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/signup" | grep -q "200" && echo "✅ Signup page working" || echo "❌ Signup page failed"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/booking" | grep -q "200" && echo "✅ Booking page working" || echo "❌ Booking page failed"

# 5. Cleanup
echo "5️⃣ Cleaning up..."
kill $SERVER_PID

echo "🎉 Testing complete! Check results above."
echo "📋 Review TESTING-CHECKLIST.md for detailed validation"
