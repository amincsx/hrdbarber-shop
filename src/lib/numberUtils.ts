/**
 * Utility functions for number formatting
 * Converts Persian/Farsi numerals to English numerals
 */

// Map of Persian numerals to English numerals
const persianToEnglishMap: { [key: string]: string } = {
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9'
};

// Map of Arabic-Indic numerals to English numerals
const arabicToEnglishMap: { [key: string]: string } = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9'
};

/**
 * Converts Persian/Farsi numerals to English numerals
 * @param str - String containing Persian numerals
 * @returns String with English numerals
 */
export function persianToEnglish(str: string | number): string {
    if (typeof str === 'number') {
        return str.toString();
    }

    return str.replace(/[۰-۹]/g, (char) => persianToEnglishMap[char] || char)
        .replace(/[٠-٩]/g, (char) => arabicToEnglishMap[char] || char);
}

/**
 * Formats a number ensuring it uses English numerals
 * @param num - Number to format
 * @returns String with English numerals
 */
export function formatNumber(num: number): string {
    return num.toString();
}

/**
 * Formats time ensuring it uses English numerals (e.g., "10:00", "14:30")
 * @param time - Time string that might contain Persian numerals
 * @returns Time string with English numerals
 */
export function formatTime(time: string): string {
    return persianToEnglish(time);
}

/**
 * Formats date string ensuring it uses English numerals
 * @param date - Date string that might contain Persian numerals
 * @returns Date string with English numerals
 */
export function formatDateString(date: string): string {
    return persianToEnglish(date);
}

/**
 * Converts Gregorian date to Jalali date
 * @param gYear - Gregorian year
 * @param gMonth - Gregorian month (1-12)
 * @param gDay - Gregorian day (1-31)
 * @returns Object with jalali year, month, day
 */
function gregorianToJalaliAccurate(gy: number, gm: number, gd: number) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;

    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
        Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];

    jy += 33 * Math.floor(days / 12053);
    days %= 12053;

    jy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days >= 366) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }

    let jm, jd;
    if (days < 186) {
        jm = 1 + Math.floor(days / 31);
        jd = 1 + (days % 31);
    } else {
        jm = 7 + Math.floor((days - 186) / 30);
        jd = 1 + ((days - 186) % 30);
    }

    return { year: jy, month: jm, day: jd };
}

/**
 * Converts a date string (YYYY-MM-DD) to Persian Jalali format (YYYY/MM/DD)
 * @param dateString - Date string in format "YYYY-MM-DD" (Gregorian)
 * @returns Date string in format "YYYY/MM/DD" (Jalali)
 */
export function convertToJalaliDateString(dateString: string): string {
    try {
        const [year, month, day] = dateString.split('-').map(Number);
        const { year: jYear, month: jMonth, day: jDay } = gregorianToJalaliAccurate(year, month, day);
        return `${jYear}/${String(jMonth).padStart(2, '0')}/${String(jDay).padStart(2, '0')}`;
    } catch (error) {
        console.error('Error converting date to Jalali:', error);
        return dateString; // Return original if conversion fails
    }
}

export default persianToEnglish;

