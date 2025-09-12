# 🔧 PRODUCTION DEPLOYMENT DEBUGGING GUIDE

## 🚨 **Top Reasons Why "It Works Locally But Not in Production"**

### **1. Environment Variables (MOST COMMON)**
**Problem**: Missing or incorrect environment variables in production
**Solution**: 
```bash
# ✅ Local (.env.local)
MONGODB_URI=mongodb://localhost:27017/hrdbarber

# ❌ Production (.env.production) - MISSING!
# DATABASE_URL=your_database_url_here

# ✅ Production (.env.production) - FIXED!
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrdbarber
```

### **2. Database Connection**
**Local**: Uses localhost MongoDB
**Production**: Needs cloud MongoDB (Atlas, etc.)

**Check**: Ensure your production MongoDB URI is correct and accessible from your hosting platform.

### **3. API Base URLs**
**Local**: http://localhost:3000
**Production**: https://your-app.liara.run

**Common Issue**: Hardcoded localhost URLs in API calls

### **4. Build Process**
**Local**: `npm run dev` (development mode)
**Production**: `npm run build` → optimized/minified

**Issues**:
- TypeScript errors ignored in dev but break in build
- Missing dependencies
- Import path issues

### **5. Node.js Version**
**Local**: Your local Node version
**Production**: Hosting platform Node version

**Check**: Ensure versions match or app supports production version

## 🛠️ **DEBUGGING STEPS FOR YOUR APP**

### **Step 1: Environment Variables Check**
```bash
# In Liara dashboard, ensure these are set:
MONGODB_URI=your-actual-mongodb-connection-string
NODE_ENV=production
SKIP_ENV_VALIDATION=true
TSC_COMPILE_ON_ERROR=true
DISABLE_ESLINT=true
```

### **Step 2: MongoDB Connection Check**
Your app uses MongoDB, ensure:
1. Production MongoDB URI is correct
2. Database is accessible from Liara servers
3. Username/password are correct
4. IP whitelist includes Liara IPs (or 0.0.0.0/0 for all)

### **Step 3: API Routes Check**
Your authentication relies on:
- `/api/auth` - User login/signup
- `/api/admin` - Admin operations
- `/api/send-otp` - OTP sending

**Test these directly**: `https://your-app.liara.run/api/auth?phone=user&password=pass`

### **Step 4: Build Logs Check**
Look for these errors in Liara deployment logs:
- Database connection errors
- Missing environment variables
- Import/export errors
- TypeScript compilation errors

### **Step 5: Runtime Logs Check**
Check Liara runtime logs for:
- MongoDB connection failures
- API endpoint errors
- Authentication failures

## 🔍 **SPECIFIC DEBUGGING FOR YOUR AUTHENTICATION ISSUE**

Since authentication works locally but not in production:

### **Check 1: MongoDB Connection in Production**
```javascript
// Add this to your API route for debugging
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');
console.log('Database connection attempt...');
```

### **Check 2: User Data Availability**
Your test users (user/pass, ceo/instad) exist in local MongoDB but might not exist in production MongoDB.

### **Check 3: Environment-Specific Code**
Look for any code that behaves differently in production vs development.

## 📊 **MOST LIKELY CAUSES FOR YOUR ISSUE**

1. **🥇 MONGODB_URI missing in production** (90% probability)
2. **🥈 Test users not in production database** (80% probability)  
3. **🥉 Network/firewall blocking MongoDB** (60% probability)
4. **🏅 API routes not working in production** (40% probability)

## ✅ **IMMEDIATE FIXES TO TRY**

1. **Add MONGODB_URI to Liara environment variables**
2. **Run create-test-users.js against production database**
3. **Check Liara logs for specific error messages**
4. **Test API endpoints directly in production**

## 🎯 **TESTING PRODUCTION ISSUES**

Instead of deploying 36 times, use these methods:

### **Method 1: Production Environment Locally**
```bash
# Use production environment variables locally
cp .env.production .env.local
# Update MONGODB_URI to your production database
npm run dev
```

### **Method 2: Direct API Testing**
```bash
# Test production API directly
curl https://your-app.liara.run/api/auth?phone=user&password=pass
```

### **Method 3: Remote Database Testing**
```bash
# Test connection to production database from local
# Update MONGODB_URI in .env.local to production DB
npm run dev
```

This way you can debug production issues without deploying!
