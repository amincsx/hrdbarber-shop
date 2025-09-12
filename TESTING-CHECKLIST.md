# 🧪 PRE-DEPLOYMENT TESTING CHECKLIST

## ✅ **Phase 1: Build & Production Testing**
- [ ] `npm run build` - Check for build errors
- [ ] `npm start` - Test production mode locally
- [ ] No console errors in browser
- [ ] All pages load correctly

## ✅ **Phase 2: Authentication Testing**
- [ ] Login with user/pass ✅
- [ ] Login with ceo/instad ✅  
- [ ] Login with invalid credentials (should fail) ✅
- [ ] Signup with new phone number ✅
- [ ] OTP sending works ✅
- [ ] Password validation works ✅

## ✅ **Phase 3: Core Functionality**
- [ ] Home page loads (/welcome)
- [ ] Booking page accessible (/booking)
- [ ] Dashboard shows after login (/dashboard)
- [ ] Admin panel works (/admin)
- [ ] Barber pages load (/barber/[id])

## ✅ **Phase 4: API Endpoints**
- [ ] /api/auth - Authentication works
- [ ] /api/admin - Admin data loads
- [ ] /api/bookings - Booking operations
- [ ] /api/send-otp - OTP functionality

## ✅ **Phase 5: Database Integration**
- [ ] MongoDB connection works
- [ ] User creation/retrieval
- [ ] Barber data (حمید, بنیامین, محمد)
- [ ] Booking operations

## ✅ **Phase 6: Environment Testing**
- [ ] Environment variables loaded
- [ ] Production build successful
- [ ] No development dependencies in production

## 🚨 **Common Deployment Issues to Check:**
1. **Build Errors**: Always run `npm run build` first
2. **Environment Variables**: Make sure all .env variables are set on hosting
3. **Database Connection**: Verify MongoDB connection string works
4. **API Routes**: Test all API endpoints locally
5. **Static Files**: Ensure all assets load correctly

## 🎯 **Pre-Deployment Commands:**
```bash
# 1. Test build
npm run build

# 2. Test production mode
npm start

# 3. Test authentication
# Visit: http://localhost:3000/test-auth.html

# 4. Test key pages
# http://localhost:3000/login
# http://localhost:3000/signup
# http://localhost:3000/booking
```

## 📊 **Success Criteria:**
- ✅ Build completes without errors
- ✅ All authentication works
- ✅ Key pages load correctly
- ✅ API endpoints respond properly
- ✅ Database operations work

**Only deploy when ALL items are checked!** ✅
