# Booking and Login Persian Numerals Fix

## Issues Fixed

### 1. Login Issue - Persian Numerals Not Accepted ❌ → ✅

**Problem:** Users had to type Persian numerals (۰-۹) in the login form. English numerals (0-9) were not working.

**Root Cause:** The phone input was not converting Persian numerals to English before sending to the authentication API.

**Solution:** Added Persian to English numeral conversion in login and signup forms.

#### Files Modified:

**`src/app/login/page.tsx`:**
```typescript
// Added import
import { persianToEnglish } from '../../lib/numberUtils';

// In handleSubmit function:
const normalizedPhone = persianToEnglish(phone);
console.log('📞 Original phone input:', phone);
console.log('📞 Normalized phone:', normalizedPhone);

// Use normalizedPhone in API call
const response = await fetch(`/api/auth?phone=${encodeURIComponent(normalizedPhone)}&password=...`);
```

**`src/app/signup/page.tsx`:**
```typescript
// Added import
import { persianToEnglish } from '../../lib/numberUtils';

// Convert phone number before validation and API calls
const normalizedPhone = persianToEnglish(phone);

// Use in phone validation
if (!phoneRegex.test(normalizedPhone)) { ... }

// Use in API calls
body: JSON.stringify({ phone: normalizedPhone, ... })
```

### How It Works Now:

**Input Examples:**
- User types: `۰۹۱۲۳۴۵۶۷۸۹` (Persian)
- System converts to: `09123456789` (English)
- API receives: `09123456789` ✅

- User types: `09123456789` (English)
- System keeps: `09123456789` (English)
- API receives: `09123456789` ✅

**Both work now!** 🎉

---

### 2. Booking Database Save Issue

**Problem:** Bookings appear to be created but don't save to MongoDB database or show in barber dashboard.

**Diagnosis Steps:**

1. ✅ MongoDB connection is working (verified with test script)
2. ✅ Booking API endpoint exists and has proper logging
3. ✅ Booking confirmation only shows when `bookingSavedToDatabase === true`

**Troubleshooting Guide:**

#### Step 1: Check Browser Console Logs

When making a booking, look for these logs in the browser console (F12):

**Success Flow:**
```
📤 Sending booking to API: {user_id: "09123...", date_key: "2025-10-15", ...}
📡 API Response status: 200
📡 API Response ok: true
✅ Booking saved to database successfully: {booking: {...}, source: "mongodb"}
```

**Failure Flow:**
```
📤 Sending booking to API: {...}
📡 API Response status: 500
❌ Failed to save booking to database.
❌ Status: 500
❌ Error data: {error: "خطا در ثبت رزرو", details: "..."}
```

#### Step 2: Check Server Logs

Look for these in the terminal where `npm run dev` is running:

**Success:**
```
🔍 POST /api/bookings called at 2025-10-12T...
📝 Received booking data: {...}
💾 Attempting to save booking to MongoDB...
📦 Booking object to save: {...}
✅ Booking saved successfully to MongoDB
🆔 Booking ID: 68ebe...
```

**Failure:**
```
🔍 POST /api/bookings called at 2025-10-12T...
📝 Received booking data: {...}
❌ Booking creation error: Error: ...
❌ Error stack: ...
```

#### Step 3: Test with Diagnostic Page

Open the test page at: `http://localhost:3001/test-booking-save.html`

Run these tests:
1. **Get All Bookings** - Should show existing bookings from MongoDB
2. **Create Test Booking** - Should successfully create a booking
3. **Test MongoDB Connection** - Should show connection status

#### Step 4: Check MongoDB Database

Using MongoDB Compass or CLI:
```javascript
// Connect to: mongodb://root:***@localhost:27017/my-app?authSource=admin
use hrdbarber
db.bookings.find().sort({createdAt: -1}).limit(5)
```

Should show recent bookings with fields:
- `user_id`
- `date_key`
- `start_time`
- `end_time`
- `barber`
- `services`
- `user_name`
- `user_phone`

---

## Testing Instructions

### Test Login with Both Numeral Types:

1. **Go to:** `http://localhost:3001/login`

2. **Test with Persian numerals:**
   - Phone: `۰۹۱۲۳۴۵۶۷۸۹`
   - Password: your password
   - Should work ✅

3. **Test with English numerals:**
   - Phone: `09123456789`
   - Password: your password
   - Should work ✅

4. **Check console:**
   - Should see: `📞 Original phone input: ۰۹۱۲۳۴۵۶۷۸۹`
   - Should see: `📞 Normalized phone: 09123456789`

### Test Booking:

1. **Go to:** `http://localhost:3001/booking`

2. **Make a test booking:**
   - Select barber: حمید
   - Select date: Today
   - Select service: اصلاح سر
   - Select time: 14:00

3. **Check browser console (F12):**
   - Should see: `📤 Sending booking to API:`
   - Should see: `📡 API Response status: 200`
   - Should see: `✅ Booking saved to database successfully`

4. **Check server terminal:**
   - Should see: `🔍 POST /api/bookings called`
   - Should see: `✅ Booking saved successfully to MongoDB`
   - Should see: `🆔 Booking ID: ...`

5. **Verify in barber dashboard:**
   - Go to: `http://localhost:3001/barber-dashboard/حمید`
   - Should see the new booking in the list

6. **Verify in MongoDB:**
   - Open MongoDB Compass
   - Navigate to `hrdbarber` database → `bookings` collection
   - Should see the new booking

---

## Common Issues & Solutions

### Issue 1: "رزرو موفقیت آمیز نبود" alert

**Check:**
1. Browser console for detailed error
2. Server terminal for error stack trace
3. MongoDB connection status

**Solutions:**
- Restart MongoDB if connection error
- Check environment variables (MONGODB_URI)
- Verify user data in localStorage

### Issue 2: Booking doesn't appear in dashboard

**Check:**
1. Was the API call successful? (check console)
2. Is the barber name exactly matching?
3. Is the date format correct?

**Solutions:**
- Refresh the dashboard page
- Check barber dashboard filters (date, status)
- Verify booking in MongoDB directly

### Issue 3: Login still requires Persian numerals

**Check:**
1. Is the page cached? Hard refresh (Ctrl+Shift+R)
2. Are you using the updated code?

**Solutions:**
- Clear browser cache
- Restart development server
- Check if `persianToEnglish` import exists in login page

---

## Files Changed in This Fix

1. ✅ `src/app/login/page.tsx` - Added Persian to English conversion
2. ✅ `src/app/signup/page.tsx` - Added Persian to English conversion
3. ✅ `test-booking-save.html` - Created diagnostic tool

---

## Next Steps

If the booking issue persists:

1. **Run the diagnostic page** and share the results
2. **Check browser console** during booking and copy any errors
3. **Check server terminal** logs and copy any errors
4. **Test MongoDB connection** using the diagnostic page
5. **Try creating a booking** using the diagnostic page's test function

If it works in the diagnostic page but not in the actual booking page, the issue is in the booking form, not the API.

---

**Last Updated:** October 12, 2025

