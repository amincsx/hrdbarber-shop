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

export default persianToEnglish;

