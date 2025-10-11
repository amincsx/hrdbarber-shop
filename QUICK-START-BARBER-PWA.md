# 🚀 Quick Start: Barber PWA

## For Developers

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Barber PWA
Open your browser and navigate to:
```
http://localhost:3000/barber-login?pwa=1
```

### 3. Login as a Barber
Use any barber credentials from your admin system.

### 4. Install the PWA

#### On Chrome (Desktop/Android):
- Look for the install icon in the address bar
- Or click the "📱 نصب اپ" button
- Click "Install"

#### On iOS Safari:
- Click the "📱 نصب اپ" button
- Tap the Share button (⬆️) at the bottom
- Select "Add to Home Screen"
- Tap "Add"

### 5. Test Notifications

1. **Allow Notifications** when prompted
2. **Create a Test Booking** from another device/browser:
   ```
   http://localhost:3000/booking
   ```
3. **Watch for**:
   - Browser notification popup
   - Audio alert (3 beeps)
   - Visual banner in dashboard

### 6. Test Offline Mode

1. Open Chrome DevTools
2. Go to Network tab
3. Check "Offline"
4. Refresh the page
5. Dashboard should still work with cached data

## For Barbers (End Users)

### Installing the App

#### Android:
1. Open: `https://hrdbarber.shop/barber-login` in Chrome
2. Login with your credentials
3. Click "📱 نصب اپ" button
4. Click "Install" in popup
5. App appears on home screen with yellow icon

#### iPhone/iPad:
1. Open: `https://hrdbarber.shop/barber-login` in **Safari**
2. Login with your credentials  
3. Click "📱 نصب اپ" button
4. Tap Share (⬆️) at bottom of screen
5. Tap "Add to Home Screen"
6. Tap "Add"

### Using the App

1. **View Bookings**: All your bookings are listed
2. **Filter**: By date or status
3. **Update Status**: 
   - ✅ Confirm booking
   - ❌ Cancel booking
   - 🎉 Mark as completed
4. **Get Notified**: Instant alerts for new bookings

### Notifications

**First Time Setup**:
- Click "Allow" when browser asks for notification permission
- Enable sound on your device

**What You'll Get**:
- 🔔 System notification with booking details
- 🎵 Audio alert (3 beeps)
- 📊 Visual banner in app
- ⏱️ Auto-refresh every 30 seconds

## Troubleshooting

### No Notifications?
1. Check notification permission in browser settings
2. Make sure sound is enabled on device
3. Verify you're logged into the correct barber account
4. Try refreshing the app

### Can't Install?
- **Android**: Update Chrome, use HTTPS, clear cache
- **iOS**: Must use Safari browser, iOS 11.3+

### Bookings Not Updating?
1. Check internet connection
2. Pull down to refresh
3. Logout and login again
4. Clear browser cache

## Production Deployment

### 1. Set Environment Variables
```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
MONGODB_URI=your_mongodb_uri
```

### 2. Build for Production
```bash
npm run build
```

### 3. Deploy
```bash
# For Liara (recommended)
liara deploy

# Or use your preferred hosting
```

### 4. Verify PWA
- Open: `https://yourdomain.com/barber-login`
- Check Chrome DevTools → Lighthouse → PWA audit
- Should score 100/100

### 5. Optional: Setup VAPID Keys (for real push)
```bash
npm install web-push
npx web-push generate-vapid-keys
```

Add to `.env`:
```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your@email.com
```

## URLs Reference

- **Barber Login**: `/barber-login`
- **Barber App Entry**: `/barber-app`
- **Barber Dashboard**: `/barber-dashboard/[barber-name]`
- **Manifest**: `/barber-manifest.json`
- **Service Worker**: `/barber-sw.js`

## API Endpoints

- `GET /api/barber/[barberId]` - Get barber bookings
- `PUT /api/barber/[barberId]` - Update booking status
- `POST /api/barber/subscribe` - Subscribe to notifications
- `POST /api/barber/notify` - Send notification

## Support

For detailed documentation, see:
- `BARBER-PWA-GUIDE.md` - Complete user guide (Farsi)
- `BARBER-PWA-IMPLEMENTATION.md` - Technical documentation

---

**Ready to Test!** 🎉

Start with: `npm run dev` then open `http://localhost:3000/barber-login?pwa=1`

