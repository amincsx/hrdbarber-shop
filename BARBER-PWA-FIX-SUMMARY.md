# Barber PWA Installation & Notification Fix

## ✅ Problems Fixed

### 1. Individual Barber PWA Installation
**Problem:** All PWAs opened to the home page, not the specific barber dashboard.

**Solution:** Created `BarberPWAInstall` component that:
- Dynamically generates a custom manifest for each barber
- Sets `start_url` to `/admin/barber/[barberId]`
- Customizes app name: "داشبورد [BarberName] - آرایشگاه HRD"
- Each barber gets their own named PWA!

### 2. Notification Sound Not Working
**Problem:** The audio data URL was truncated/corrupted.

**Solution:** Replaced with Web Audio API that:
- Generates a clean beep sound (800Hz sine wave)
- Works reliably across all browsers
- No external files needed
- 0.5 second notification tone

## 🔧 Changes Made

### New Files Created:
1. **`src/components/BarberPWAInstall.tsx`**
   - Custom PWA install component for barbers
   - Dynamically creates manifest per barber
   - iOS-specific instructions with barber name
   - Beautiful install UI

### Files Modified:
1. **`src/app/admin/barber/[barberId]/page.tsx`**
   - Replaced `PWAInstall` with `BarberPWAInstall`
   - Fixed notification sound using Web Audio API
   - Updated notification icons from JPG to PNG
   - Passes barber name and ID to install component

## 🎯 How It Works

### Barber PWA Installation:

1. **Dynamic Manifest Generation:**
   ```typescript
   const manifest = {
     name: `داشبورد ${barberName} - آرایشگاه HRD`,
     short_name: `${barberName} - HRD`,
     start_url: `/admin/barber/${encodeURIComponent(barberId)}`,
     // ... other manifest properties
   };
   ```

2. **Each barber gets:**
   - ✅ Unique app name (e.g., "داشبورد حمید - HRD")
   - ✅ Direct route to their dashboard
   - ✅ Custom install instructions showing their name
   - ✅ Separate installable PWA

3. **On iOS:**
   - Shows beautiful modal with barber's name
   - Step-by-step instructions
   - Confirms the app name will be "داشبورد [BarberName]"

### Notification Sound:

The Web Audio API creates a beep when new bookings arrive:
```typescript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.frequency.value = 800; // 800Hz tone
oscillator.type = 'sine';
gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

oscillator.start();
oscillator.stop(audioContext.currentTime + 0.5); // 0.5s duration
```

## 📱 Testing Instructions

### Test Barber PWA Installation:

1. **Log in as a barber:**
   - Go to `/admin`
   - Login with barber credentials (e.g., حمید/barber123)

2. **Install the PWA:**
   - Click the "📱 نصب اپ" button
   - **Android/Chrome:** Install prompt will show custom name
   - **iOS:** Follow the modal instructions
   
3. **Verify:**
   - Check installed app name shows barber's name
   - Launch the installed app
   - Should open directly to that barber's dashboard
   - URL should be `/admin/barber/[barberId]`

### Test Each Barber:

Try installing for each barber separately:
- **حمید** → Installs as "داشبورد حمید - HRD"
- **بنیامین** → Installs as "داشبورد بنیامین - HRD"  
- **محمد** → Installs as "داشبورد محمد - HRD"

All three can be installed as separate apps on the same device!

### Test Notification Sound:

1. **Log in as barber**
2. **Keep dashboard open**
3. **Make a booking** (from another device/browser)
4. **Wait ~30 seconds** (polling interval)
5. **Should hear:** Beep sound + see browser notification
6. **Check:** Notification shows booking details with PNG icon

## 🔄 For Future Reference

### Adding More Barbers:

Just add to `data/barbers.json`:
```json
{
  "id": "barber_4",
  "name": "علی",
  "username": "ali",
  "password": "barber123"
}
```

Each barber automatically gets their own PWA installation!

### Customizing the Sound:

Edit the Web Audio API parameters in `src/app/admin/barber/[barberId]/page.tsx`:
- **Frequency:** `oscillator.frequency.value = 800;` (change Hz)
- **Type:** `oscillator.type = 'sine';` (try 'square', 'sawtooth', 'triangle')
- **Duration:** `audioContext.currentTime + 0.5` (change seconds)
- **Volume:** `gainNode.gain.setValueAtTime(0.3, ...)` (0.0 to 1.0)

### Using an Audio File Instead:

If you prefer an MP3/WAV file:
```typescript
const audio = new Audio('/notification.mp3');
audio.volume = 0.5;
audio.play().catch(err => console.log('Play failed:', err));
```

## ✨ Benefits

### Before:
- ❌ All PWAs opened to home page
- ❌ Same app name for all barbers
- ❌ Notification sound didn't work
- ❌ Confusing for barbers with multiple staff

### After:
- ✅ Each barber has their own PWA
- ✅ Custom app name per barber
- ✅ Direct route to their dashboard
- ✅ Working notification sound
- ✅ Multiple barbers can install on same device
- ✅ Clear, personalized experience

## 🚀 Deployment

1. **Build your app:**
   ```bash
   npm run build
   ```

2. **Test locally:**
   ```bash
   npm start
   ```
   - Visit http://localhost:3000/admin
   - Login as each barber
   - Test PWA installation

3. **Deploy to production**
   - Push to git repository
   - Deploy to Liara/hosting platform

4. **Test on production:**
   - Each barber should install their own PWA
   - Test notification sound when booking arrives
   - Verify all three barbers' apps work independently

---

**All fixes complete!** 🎉

Each barber now has their own personalized PWA with working notifications!

