# Persian to English Numerals Fix

## Problem
The application was displaying Persian/Farsi numerals (۰-۹) instead of English numerals (0-9) in dates, times, and other numeric displays. This happened because JavaScript's `toLocaleDateString('fa-IR')` automatically converts numbers to Persian numerals.

### Examples of Persian vs English Numerals:
- Persian: ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹
- English: 0 1 2 3 4 5 6 7 8 9

## Solution
Created a utility function to convert Persian/Farsi numerals to English numerals throughout the application.

## Files Created

### 1. `src/lib/numberUtils.ts`
New utility file with helper functions:
- `persianToEnglish(str)` - Converts Persian numerals to English
- `formatNumber(num)` - Formats numbers with English numerals
- `formatTime(time)` - Formats time strings with English numerals
- `formatDateString(date)` - Formats date strings with English numerals

```typescript
// Example usage:
import { persianToEnglish } from '@/lib/numberUtils';

const persianDate = '۱۴۰۴/۰۷/۲۱'; // 1404/07/21 in Persian
const englishDate = persianToEnglish(persianDate); // '1404/07/21'
```

## Files Modified

All files that use `toLocaleDateString('fa-IR')` have been updated to convert Persian numerals to English:

### Dashboard Pages:
1. **`src/app/dashboard/page.tsx`**
   - Added import: `import { persianToEnglish } from '../../lib/numberUtils';`
   - Updated `formatPersianDate()` function
   - Updated `setNextAvailableTime()` calls

2. **`src/app/dashboard/page_new.tsx`**
   - Added import: `import { persianToEnglish } from '../../lib/numberUtils';`
   - Updated `formatPersianDate()` function
   - Updated `setNextAvailableTime()` calls

### Barber Dashboard Pages:
3. **`src/app/barber-dashboard/[barberId]/page.tsx`**
   - Added import: `import { persianToEnglish } from '../../../lib/numberUtils';`
   - Updated `formatDate()` function

### Admin Pages:
4. **`src/app/admin/barber/[barberId]/page.tsx`**
   - Added import: `import { persianToEnglish } from '../../../../lib/numberUtils';`
   - Updated `formatDate()` function

5. **`src/app/admin/owner/page.tsx`**
   - Added import: `import { persianToEnglish } from '../../../lib/numberUtils';`
   - Updated `formatDate()` function

### Barber Public Pages:
6. **`src/app/barber/[barberId]/page_fixed.tsx`**
   - Added import: `import { persianToEnglish } from '../../../lib/numberUtils';`
   - Updated `formatDate()` function

### Error Messages:
7. **`src/app/api/forgot-password/route.js`**
   - Changed: `'رمز عبور باید حداقل ۴ کاراکتر باشد'`
   - To: `'رمز عبور باید حداقل 4 کاراکتر باشد'`

8. **`src/app/login/page.tsx`**
   - Changed: `'رمز عبور باید حداقل ۴ کاراکتر باشد'`
   - To: `'رمز عبور باید حداقل 4 کاراکتر باشد'`

## Implementation Pattern

The typical pattern used throughout the codebase:

### Before:
```typescript
const formatDate = (dateKey: string) => {
    const date = new Date(dateKey);
    return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
};
```

### After:
```typescript
import { persianToEnglish } from '../../../lib/numberUtils';

const formatDate = (dateKey: string) => {
    const date = new Date(dateKey);
    // Convert Persian numerals to English numerals
    return persianToEnglish(date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    }));
};
```

## How It Works

1. **Persian Calendar** - The app still uses the Persian (Jalali) calendar for dates
2. **Persian Text** - Month names and day names remain in Farsi (e.g., "فروردین", "شنبه")
3. **English Numerals** - Only the numbers are converted from Persian to English

### Example Output:

**Before Fix:**
```
شنبه ۲۱ مهر ۱۴۰۴
ساعت: ۱۰:۳۰
```

**After Fix:**
```
شنبه 21 مهر 1404
ساعت: 10:30
```

## Testing

To verify the fix is working:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Check Dashboard:**
   - Go to `/dashboard`
   - Check booking dates - numbers should be in English (0-9)
   - Check times - should show like "10:00", not "۱۰:۰۰"

3. **Check Barber Dashboard:**
   - Go to `/barber-dashboard/[barberId]`
   - All dates and times should use English numerals

4. **Check Admin Panel:**
   - Go to `/admin/owner`
   - All dates and times should use English numerals

5. **Make a Test Booking:**
   - Go to `/booking`
   - Complete a booking
   - Check the confirmation screen - all numbers should be English

## Browser Compatibility

The `persianToEnglish()` function handles:
- Persian numerals (۰-۹) - Used in Persian/Farsi
- Arabic-Indic numerals (٠-٩) - Used in some Arabic contexts
- Already English numerals (0-9) - Pass through unchanged

## Performance

The conversion function is very lightweight:
- Uses simple string replacement with regex
- No external dependencies
- Minimal performance impact
- Cached in format functions

## Future Enhancements

If you want to add the option to switch between Persian and English numerals in the future:

1. Add a setting in user preferences
2. Create a context provider for numeral format
3. Conditionally apply `persianToEnglish()` based on user preference

Example:
```typescript
const formatDate = (dateKey: string) => {
    const date = new Date(dateKey);
    const formattedDate = date.toLocaleDateString('fa-IR', options);
    
    // Apply conversion based on user preference
    return useEnglishNumerals ? persianToEnglish(formattedDate) : formattedDate;
};
```

## Summary

✅ **All numeric displays now use English numerals (0-9)**
✅ **Persian calendar and text remain unchanged**
✅ **Dates show format: "شنبه 21 مهر 1404" instead of "شنبه ۲۱ مهر ۱۴۰۴"**
✅ **Times show format: "10:30" instead of "۱۰:۳۰"**
✅ **Error messages use English numerals**

---
**Last Updated:** October 12, 2025

