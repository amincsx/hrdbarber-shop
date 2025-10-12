# Barber Dashboard Booking Fix

## Problem
Booked times are not showing up on the barber dashboard (e.g., `http://localhost:3000/barber-dashboard/mohammad`).

## Root Causes Identified

1. **Missing PUT Handler**: The barber dashboard was trying to update booking status using the PUT method, but the API route only had GET and POST handlers.

2. **Parameter Mismatch**: The dashboard was sending `booking_id` but the route was expecting `bookingId`.

3. **Barber Name Mapping Issue**: 
   - Bookings are saved with Farsi names (e.g., "محمد")
   - Dashboard URLs use English usernames (e.g., "mohammad")
   - The system needs a User record to map between these two

## Fixes Applied

### 1. Added PUT Handler (`src/app/api/barber/[barberId]/route.js`)
- Added a PUT method to handle booking status updates
- Accepts both `booking_id` and `bookingId` for compatibility
- Properly maps between English username and Farsi name

### 2. Enhanced Logging
- Added detailed logging to help diagnose issues
- Shows total bookings in DB, barber name mapping, and search results

### 3. Created Debug Tools
Two new API endpoints to help diagnose and fix the issue:

#### a. `/api/debug-bookings`
Shows all bookings and barber user mappings.

**Usage:**
```bash
# See all bookings and summary
curl http://localhost:3000/api/debug-bookings

# See bookings for specific barber
curl http://localhost:3000/api/debug-bookings?barber=mohammad
```

#### b. `/api/init-barbers`
Initializes barber user accounts for authentication.

**Usage:**
```bash
# Initialize all barber users
curl http://localhost:3000/api/init-barbers

# Manually add a barber user
curl -X POST http://localhost:3000/api/init-barbers \
  -H "Content-Type: application/json" \
  -d '{"username":"mohammad","name":"محمد","password":"mohammad123"}'
```

## Step-by-Step Diagnosis

### Step 1: Check if Bookings Exist
```bash
curl http://localhost:3000/api/debug-bookings
```

Look at the response:
- `total_bookings`: Should show how many bookings exist
- `barber_booking_counts`: Shows bookings per barber
- `sample_bookings`: Shows some example bookings

**Expected:** You should see bookings with barber names like "محمد", "حمید", "بنیامین"

### Step 2: Check Barber User Mappings
Same response from Step 1, look at:
- `barber_users`: Should show username → name mappings
- Example: `{"username": "mohammad", "name": "محمد"}`

**Expected:** You should see mappings for all barbers (mohammad, hamid, benyamin)

### Step 3: Initialize Barber Users (if missing)
If Step 2 shows empty `barber_users`, run:
```bash
curl http://localhost:3000/api/init-barbers
```

This will automatically create user accounts for all barbers in the database.

### Step 4: Check Specific Barber
```bash
curl http://localhost:3000/api/debug-bookings?barber=mohammad
```

This should show:
- Whether the barber user was found
- The Farsi name mapping
- All bookings for that barber

### Step 5: Test Dashboard
Open the barber dashboard:
```
http://localhost:3000/barber-dashboard/mohammad
```

Check the browser console (F12) for detailed logs showing:
- Barber lookup results
- Total bookings found
- Sample booking data

## Common Issues & Solutions

### Issue: No bookings showing up

**Diagnosis:**
1. Check browser console for logs starting with 🔍
2. Look for "Barber user found: no"

**Solution:**
```bash
# Initialize barber users
curl http://localhost:3000/api/init-barbers

# Or manually create:
curl -X POST http://localhost:3000/api/init-barbers \
  -H "Content-Type: application/json" \
  -d '{"username":"mohammad","name":"محمد"}'
```

### Issue: Bookings exist but wrong barber name

**Diagnosis:**
Look at the debug output:
```json
{
  "barber_booking_counts": {
    "mohammad": 5,  // Wrong - should be Farsi name
    "محمد": 3       // Correct
  }
}
```

**Solution:**
The booking page needs to use the Farsi name. This is already correct in the current code (line 903 in `booking/page.tsx` uses `barber.name`).

### Issue: Status updates not working

**Diagnosis:**
Browser console shows 404 or Method Not Allowed errors when clicking confirm/cancel.

**Solution:**
This is now fixed with the PUT handler. Restart the server:
```bash
npm run dev
```

## Manual Barber User Creation

If you need to manually create barber user accounts:

```javascript
// Run this in MongoDB or via API
{
  "username": "mohammad",  // English username for URL
  "name": "محمد",          // Farsi name (matches barber documents)
  "password": "mohammad123",
  "role": "barber"
}

{
  "username": "hamid",
  "name": "حمید",
  "password": "hamid123",
  "role": "barber"
}

{
  "username": "benyamin",
  "name": "بنیامین",
  "password": "benyamin123",
  "role": "barber"
}
```

## Testing Checklist

- [ ] Run `/api/debug-bookings` - see bookings exist
- [ ] Run `/api/init-barbers` - initialize user accounts
- [ ] Check console logs when opening dashboard
- [ ] Verify bookings display on dashboard
- [ ] Test status update (confirm/cancel buttons)
- [ ] Create a new booking and verify it appears immediately

## Additional Notes

### Booking Flow
1. User creates booking → saved with Farsi barber name (e.g., "محمد")
2. Barber opens dashboard → uses English username in URL (e.g., "/mohammad")
3. System looks up User by username "mohammad"
4. Gets Farsi name "محمد" from User record
5. Searches bookings for barber="محمد"

### Required User Documents
The system requires User documents for barbers with:
- `username`: English (for URL/login)
- `name`: Farsi (matches booking documents)
- `role`: "barber"

Without these User documents, the barber dashboard cannot find bookings.

## Logs to Watch

When you open the barber dashboard, you should see logs like:

```
🔍 Barber API called with:
  - Raw barberId: mohammad
  - Decoded barberId: mohammad
  - Barber user found: yes
  - Barber name: محمد
  - Total bookings in DB: 15
  - Bookings by name: 5
  - Bookings by username: 0
📊 Found 5 total bookings for mohammad
✅ Returning 5 bookings for barber mohammad
```

If you see "Barber user found: no", that's the issue - run `/api/init-barbers`.

