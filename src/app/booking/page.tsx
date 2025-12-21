'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

// Persian calendar utility functions
const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const persianWeekDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

// Online Persian date API service
async function getAccuratePersianDate(date: Date): Promise<string> {
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Using holidayapi.ir for accurate Persian calendar
        const response = await fetch(`https://holidayapi.ir/jalali/${year}/${month}/${day}`);
        console.log('API Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('API Data:', data);

            if (data && data.jalali) {
                const persianDate = data.jalali;
                return `${persianDate.weekday} ${persianDate.day} ${persianDate.month_name} ${persianDate.year}`;
            }
        }
    } catch (error) {
        console.log('holidayapi.ir failed:', error);
    }

    // Fallback to simple local conversion
    return getSimplePersianDate(date);
}

// Simple Persian date conversion (backup)
function getSimplePersianDate(date: Date): string {
    const jsWeekDay = date.getDay();
    const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const weekDay = weekdays[jsWeekDay];

    // Accurate Gregorian to Jalali conversion
    const { year: jYear, month: jMonth, day: jDay } = gregorianToJalaliAccurate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    );

    const monthName = persianMonths[jMonth - 1];
    return `${weekDay} ${jDay} ${monthName} ${jYear}`;
}

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

// Local Persian date conversion (fallback)
function formatPersianDateLocal(date: Date) {
    const gregorian = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
    };

    const jalali = gregorianToJalali(gregorian.year, gregorian.month, gregorian.day);

    // More accurate weekday calculation
    // September 9, 2025 is a Tuesday (getDay() = 2)
    // In Persian calendar: Saturday=شنبه, Sunday=یکشنبه, Monday=دوشنبه, Tuesday=سه‌شنبه, etc.
    const jsWeekDay = date.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

    // Persian weekdays mapping: [Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday]
    const weekdayMapping = [1, 2, 3, 4, 5, 6, 0]; // Maps JS weekdays to Persian weekdays index
    const persianWeekDayIndex = weekdayMapping[jsWeekDay];
    const weekDay = persianWeekDays[persianWeekDayIndex];

    return `${weekDay} ${jalali.day} ${persianMonths[jalali.month - 1]} ${jalali.year}`;
}

function gregorianToJalali(gYear: number, gMonth: number, gDay: number) {
    // More accurate Gregorian to Jalali conversion algorithm
    const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

    if (gYear <= 1600) {
        let jYear = 0;
        let gYear2 = gYear - 621;

        if (gMonth > 2) {
            let gy2 = gYear2 + 1;
            let days = 365 * gYear2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gDay + gDaysInMonth.slice(0, gMonth - 1).reduce((a, b) => a + b, 0);
            jYear = Math.floor(days / 365.2422) + 1;
        } else {
            let days = 365 * gYear2 + Math.floor(gYear2 / 4) - Math.floor(gYear2 / 100) + Math.floor(gYear2 / 400) + gDay + (gMonth === 2 ? 31 : 0) - 79;
            jYear = Math.floor(days / 365.2422) + 1;
        }

        return approximateJalali(jYear, gYear, gMonth, gDay);
    }

    // Use epoch-based calculation for modern dates
    const gEpoch = new Date(gYear, gMonth - 1, gDay).getTime();
    const jEpoch = new Date(1979, 2, 22).getTime(); // March 22, 1979 = 1 Farvardin 1358
    const daysDiff = Math.floor((gEpoch - jEpoch) / (24 * 60 * 60 * 1000));

    let jYear = 1358;
    let remainingDays = daysDiff;

    // Calculate years
    while (remainingDays >= 365) {
        const isLeap = ((jYear + 2346) % 2820 % 128) <= 29 ? true : false;
        const yearDays = isLeap ? 366 : 365;
        if (remainingDays >= yearDays) {
            remainingDays -= yearDays;
            jYear++;
        } else {
            break;
        }
    }

    // Calculate month and day
    let jMonth = 1;
    while (jMonth <= 12 && remainingDays >= jDaysInMonth[jMonth - 1]) {
        if (jMonth <= 6 || (jMonth > 6 && remainingDays >= 30) || (jMonth === 12 && ((jYear + 2346) % 2820 % 128) <= 29 && remainingDays >= 30)) {
            remainingDays -= jDaysInMonth[jMonth - 1];
            jMonth++;
        } else {
            break;
        }
    }

    const jDay = remainingDays + 1;

    return { year: jYear, month: jMonth, day: jDay };
}

function approximateJalali(jYear: number, gYear: number, gMonth: number, gDay: number) {
    // Simplified approximation for dates before 1600
    const dayOfYear = new Date(gYear, gMonth - 1, gDay).getTime() - new Date(gYear, 0, 1).getTime();
    const dayIndex = Math.floor(dayOfYear / (24 * 60 * 60 * 1000));

    let jMonth = Math.floor(dayIndex / 30) + 1;
    let jDay = (dayIndex % 30) + 1;

    if (jMonth > 12) {
        jMonth = 12;
        jDay = Math.min(29, jDay);
    }

    return { year: jYear, month: jMonth, day: jDay };
}

export default function BookingPage() {
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
    const [isBooked, setIsBooked] = useState(false);
    const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
    const [persianDateCache, setPersianDateCache] = useState<{ [key: string]: string }>({});
    const [currentTime, setCurrentTime] = useState(new Date()); // Add current time state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingBooking, setEditingBooking] = useState<any>(null); // For edit mode
    const [isEditMode, setIsEditMode] = useState(false);

    // Helper function to get Persian date (cached)
    const formatPersianDate = async (date: Date): Promise<string> => {
        const dateKey = date.toDateString();

        if (persianDateCache[dateKey]) {
            return persianDateCache[dateKey];
        }

        const persianDate = await getAccuratePersianDate(date);
        setPersianDateCache(prev => ({ ...prev, [dateKey]: persianDate }));
        return persianDate;
    };

    // Synchronous version for immediate display (uses cached API results or backup)
    const formatPersianDateSync = (date: Date): string => {
        const dateKey = date.toDateString();

        if (persianDateCache[dateKey]) {
            return persianDateCache[dateKey];
        }

        // Use simple backup conversion instead of loading
        return getSimplePersianDate(date);
    };
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [existingBookings, setExistingBookings] = useState<any[]>([]);
    const [showAllTimeSlots, setShowAllTimeSlots] = useState(false);
    const [selectedBarber, setSelectedBarber] = useState<string>('');
    const [availableBarbers, setAvailableBarbers] = useState<any[]>([]);
    const [barberAvailabilities, setBarberAvailabilities] = useState<{ [key: string]: any }>({});

    // Load barbers from MongoDB
    const loadBarbersFromDatabase = async () => {
        try {
            console.log('🔍 Loading barbers from MongoDB...');
            const response = await fetch('/api/admin?action=barbers');
            if (response.ok) {
                const data = await response.json();
                if (data.barbers && data.barbers.length > 0) {
                    setAvailableBarbers(data.barbers);
                    console.log('✅ Loaded barbers from MongoDB:', data.barbers.length);
                    console.log('   Barbers:', data.barbers.map((b: any) => b.name));

                    // Load availability for each barber
                    await loadBarberAvailabilities(data.barbers);
                } else {
                    console.log('ℹ️ No barbers found in MongoDB, keeping default list');
                }
            } else {
                console.error('❌ Failed to load barbers from database, status:', response.status);
            }
        } catch (error) {
            console.error('❌ Error loading barbers:', error);
            console.log('ℹ️ Keeping default barber list');
        }
    };

    // Load availability for a single barber (with cache busting)
    const loadSingleBarberAvailability = async (barberName: string) => {
        try {
            // Find the barber object to get the username
            const barberObj = availableBarbers.find(b => b.name === barberName);
            const barberId = barberObj?.username || barberName; // Use username if available, fallback to name

            console.log('🔍 Loading availability for barber:', barberName, 'using ID:', barberId);

            // Add timestamp to bypass cache
            const timestamp = Date.now();
            const response = await fetch(`/api/barber/availability?barberId=${encodeURIComponent(barberId)}&t=${timestamp}&_=${Math.random()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.availability) {
                    setBarberAvailabilities(prev => ({
                        ...prev,
                        [barberName]: result.availability
                    }));
                    console.log(`✅ Loaded fresh availability for ${barberName}:`, result.availability);
                } else {
                    console.log(`ℹ️ Using default schedule for ${barberName}`);
                    setBarberAvailabilities(prev => ({
                        ...prev,
                        [barberName]: getDefaultBarberSchedule()
                    }));
                }
            } else {
                console.log(`⚠️ Failed to load availability for ${barberName}, using default`);
                setBarberAvailabilities(prev => ({
                    ...prev,
                    [barberName]: getDefaultBarberSchedule()
                }));
            }
        } catch (error) {
            console.warn(`⚠️ Error loading availability for ${barberName}:`, error);
            setBarberAvailabilities(prev => ({
                ...prev,
                [barberName]: getDefaultBarberSchedule()
            }));
        }
    };

    // Load availability for all barbers
    const loadBarberAvailabilities = async (barbers: any[]) => {
        console.log('🔄 Loading availability for all barbers...');
        for (const barber of barbers) {
            try {
                const barberId = barber.username || barber.name;
                const timestamp = Date.now();
                const response = await fetch(`/api/barber/availability?barberId=${encodeURIComponent(barberId)}&t=${timestamp}&_=${Math.random()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.availability) {
                        setBarberAvailabilities(prev => ({
                            ...prev,
                            [barber.name]: result.availability
                        }));
                        console.log(`✅ Loaded availability for ${barber.name}:`, result.availability);
                    } else {
                        console.log(`ℹ️ Using default schedule for ${barber.name}`);
                        setBarberAvailabilities(prev => ({
                            ...prev,
                            [barber.name]: getDefaultBarberSchedule()
                        }));
                    }
                } else {
                    console.log(`⚠️ Failed to load availability for ${barber.name}, using default`);
                    setBarberAvailabilities(prev => ({
                        ...prev,
                        [barber.name]: getDefaultBarberSchedule()
                    }));
                }
            } catch (error) {
                console.warn(`⚠️ Error loading availability for ${barber.name}:`, error);
                setBarberAvailabilities(prev => ({
                    ...prev,
                    [barber.name]: getDefaultBarberSchedule()
                }));
            }
        }
        console.log('✅ Finished loading all barber availabilities');
    };

    // Get default barber schedule
    const getDefaultBarberSchedule = () => ({
        workingHours: { start: 10, end: 21 },
        lunchBreak: { start: 14, end: 15 },
        offDays: [],
        offHours: [], // Add flexible off hours
        isAvailable: true // Default to available
    });

    // Get barber schedule from loaded availability or fallback to hardcoded
    const getBarberSchedule = (barberName: string) => {
        // First try to get from loaded availability
        if (barberAvailabilities[barberName]) {
            const availability = barberAvailabilities[barberName];
            return {
                start: availability.workingHours?.start || 10,
                end: availability.workingHours?.end || 21,
                lunchStart: availability.lunchBreak?.start || 14,
                lunchEnd: availability.lunchBreak?.end || 15,
                offDays: availability.offDays || [],
                offHours: availability.offHours || [], // Add flexible off hours
                isAvailable: availability.isAvailable === true
            };
        }

        // Fallback to hardcoded schedules for backward compatibility
        const hardcodedSchedules = {};

        return hardcodedSchedules[barberName as keyof typeof hardcodedSchedules] || {
            start: 10,
            end: 21,
            lunchStart: 14,
            lunchEnd: 15,
            offDays: [],
            offHours: [],
            isAvailable: true
        };
    };

    // Check if a specific time slot is blocked by flexible off hours
    const isTimeSlotBlocked = (barberName: string, timeSlot: string, selectedDate: Date) => {
        const schedule = getBarberSchedule(barberName);
        if (!schedule.offHours || schedule.offHours.length === 0) return false;

        const selectedDateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        for (const offHour of schedule.offHours) {
            // If off hour has a specific date, check if it matches
            if (offHour.date && offHour.date !== selectedDateStr) {
                continue; // This off hour doesn't apply to the selected date
            }

            // Check if time slot falls within the off hour range
            if (timeSlot >= offHour.start && timeSlot < offHour.end) {
                return true; // Time slot is blocked
            }
        }

        return false;
    };

    // Generate time slots based on selected barber's schedule
    const generateTimeSlots = (barberName: string) => {
        // Check if barber has custom schedule, otherwise use default
        const schedule = getBarberSchedule(barberName);

        // Don't generate slots if barber is not available
        if (!schedule.isAvailable) {
            return [];
        }

        const slots = [];

        // Only generate o'clock times (no :15, :30, :45)
        for (let hour = schedule.start; hour < schedule.end; hour++) {
            // Skip lunch break times
            if (schedule.lunchStart && schedule.lunchEnd) {
                if (hour >= schedule.lunchStart && hour < schedule.lunchEnd) {
                    continue; // Skip this hour (it's lunch time)
                }
            }

            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            slots.push(timeStr);
        }

        return slots;
    };

    // Generate all possible time slots for the selected barber (every 15 minutes)
    const generateAllTimeSlots = () => {
        if (!selectedBarber) {
            // Default slots if no barber selected
            const slots = [];
            for (let hour = 10; hour <= 20; hour++) {
                for (let minute = 0; minute < 60; minute += 15) {
                    if (hour === 20 && minute > 45) break;
                    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    slots.push(timeStr);
                }
            }
            slots.push('21:00');
            return slots;
        }

        return generateTimeSlots(selectedBarber);
    };

    const allTimeSlots = generateAllTimeSlots();

    const services = [
        { name: 'اصلاح vip (اصلاح + شست و شو + ماساژ صورت)', duration: 60 },
        { name: 'اصلاح سر و صورت', duration: 45 },
        { name: 'اصلاح سر', duration: 30 },
        { name: 'اصلاح صورت', duration: 15 },
        { name: 'وکس', duration: 15 },
        { name: 'پروتین', duration: 90 },
        { name: 'کراتین', duration: 90 },
        { name: 'فیشیال', duration: 60 },
        { name: 'حالت', duration: 0, isSpecial: true }
    ];

    // Generate time slots based on selected services and existing bookings
    const getBasicTimeSlots = () => {
        if (!selectedBarber) {
            // Default slots - only o'clock times
            return [
                '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
                '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
            ];
        }

        const schedule = getBarberSchedule(selectedBarber);

        // Don't generate slots if barber is not available
        if (!schedule.isAvailable) {
            return [];
        }

        const slots = [];

        // Check if ONLY face cut or wax is selected (alone, not combined with other services)
        const hasFaceCutOrWaxAlone = selectedServices.length === 1 &&
            (selectedServices[0] === 'اصلاح صورت' || selectedServices[0] === 'وکس');

        if (hasFaceCutOrWaxAlone) {
            // For face cut and wax ALONE, show ONLY :30 times (no o'clock times)
            for (let hour = schedule.start; hour < schedule.end - 0.5; hour++) {
                // Skip lunch break times
                if (schedule.lunchStart && schedule.lunchEnd) {
                    if (hour + 0.5 >= schedule.lunchStart && hour + 0.5 < schedule.lunchEnd) {
                        continue; // Skip this :30 slot (it's lunch time)
                    }
                }

                // Check if selected date is today
                const isToday = selectedDateObj &&
                    selectedDateObj.toDateString() === currentTime.toDateString();

                if (isToday) {
                    // If it's today, check if there are at least 30 minutes until this :30 time
                    const currentHours = currentTime.getHours();
                    const currentMinutes = currentTime.getMinutes();
                    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
                    const targetTimeInMinutes = hour * 60 + 30; // :30 time
                    const minutesUntilTarget = targetTimeInMinutes - currentTimeInMinutes;

                    // Only show if there are at least 30 minutes until this time
                    if (minutesUntilTarget >= 30) {
                        slots.push(`${hour.toString().padStart(2, '0')}:30`);
                    }
                } else {
                    // For future dates, show all :30 times
                    slots.push(`${hour.toString().padStart(2, '0')}:30`);
                }
            }
        } else {
            // For other services, show only o'clock times
            for (let hour = schedule.start; hour < schedule.end; hour++) {
                // Skip lunch break times
                if (schedule.lunchStart && schedule.lunchEnd) {
                    if (hour >= schedule.lunchStart && hour < schedule.lunchEnd) {
                        continue; // Skip this hour (it's lunch time)
                    }
                }

                // Check if selected date is today
                const isToday = selectedDateObj &&
                    selectedDateObj.toDateString() === currentTime.toDateString();

                if (isToday) {
                    // If it's today, check if there are at least 30 minutes until this o'clock time
                    const currentHours = currentTime.getHours();
                    const currentMinutes = currentTime.getMinutes();
                    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
                    const targetTimeInMinutes = hour * 60;
                    const minutesUntilTarget = targetTimeInMinutes - currentTimeInMinutes;

                    // Only show if there are at least 30 minutes until this time
                    if (minutesUntilTarget >= 30) {
                        slots.push(`${hour.toString().padStart(2, '0')}:00`);
                    }
                } else {
                    // For future dates, show all o'clock times
                    slots.push(`${hour.toString().padStart(2, '0')}:00`);
                }
            }
        }

        // Add :45 times if there are existing bookings that end at :45
        if (selectedDateObj && selectedBarber) {
            const dateKey = selectedDateObj.toISOString().split('T')[0];
            const existingBookingsForDate = existingBookings.filter(booking =>
                booking.date === dateKey && booking.barber === selectedBarber
            );

            existingBookingsForDate.forEach(booking => {
                const startTime = timeToMinutes(booking.time);
                const duration = getServiceDuration(booking.services);
                const endTime = startTime + duration;
                const endHour = Math.floor(endTime / 60);
                const endMinute = endTime % 60;

                // If booking ends at :45, add that time slot
                if (endMinute === 45 && endHour < schedule.end) {
                    const timeSlot = `${endHour.toString().padStart(2, '0')}:45`;
                    if (!slots.includes(timeSlot)) {
                        slots.push(timeSlot);
                    }
                }
            });
        }

        // Sort slots by time
        return slots.sort((a, b) => {
            const [hourA, minA] = a.split(':').map(Number);
            const [hourB, minB] = b.split(':').map(Number);
            return (hourA * 60 + minA) - (hourB * 60 + minB);
        });
    };

    // Get duration for services
    const getServiceDuration = (serviceNames: string[]): number => {
        return serviceNames.reduce((total, serviceName) => {
            const service = services.find(s => s.name === serviceName);
            return total + (service?.duration || 0);
        }, 0);
    };

    const timeSlots = getBasicTimeSlots();

    // Check if barber is available on selected date
    const isBarberAvailableOnDate = (barberName: string, date: Date) => {
        const schedule = getBarberSchedule(barberName);

        // Check if barber is generally available
        if (!schedule.isAvailable) return false;

        if (!schedule.offDays || schedule.offDays.length === 0) return true;

        // Get Persian day name for the selected date
        const persianDate = formatPersianDateSync(date);
        const dayName = persianDate.split(' ')[0]; // Get the day name (first word)

        // Check if this day is in the barber's off days
        return !schedule.offDays.includes(dayName);
    };

    const getTotalDuration = () => {
        return selectedServices.reduce((total, serviceName) => {
            const service = services.find(s => s.name === serviceName);
            return total + (service?.duration || 0);
        }, 0);
    };

    const handleServiceToggle = (serviceName: string) => {
        setSelectedServices(prev => {
            if (prev.includes(serviceName)) {
                return prev.filter(s => s !== serviceName);
            } else {
                // If selecting "حالت", clear other services
                if (serviceName === 'حالت') {
                    return [serviceName];
                }
                // If selecting other services, remove "حالت"
                const filtered = prev.filter(s => s !== 'حالت');
                return [...filtered, serviceName];
            }
        });
        // Reset selected time when services change
        setSelectedTime('');
    };

    const getAvailableTimeSlots = () => {
        const totalDuration = getTotalDuration();
        const currentHours = currentTime.getHours();
        const currentMinutes = currentTime.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        // Check if selected date is today
        const isToday = selectedDateObj &&
            selectedDateObj.toDateString() === currentTime.toDateString();

        // Check if barber is available on selected date
        const isBarberAvailable = selectedBarber && selectedDateObj ?
            isBarberAvailableOnDate(selectedBarber, selectedDateObj) : true;

        // If barber is not available on this date, return empty array
        if (!isBarberAvailable) {
            return [];
        }

        const baseSlotsToUse = totalDuration === 0 ? timeSlots : timeSlots;
        const blockedSlots = new Set<string>();

        // Get existing bookings for selected date and barber to block conflicting times
        if (selectedDateObj && selectedBarber) {
            const dateKey = selectedDateObj.toISOString().split('T')[0];
            console.log('Checking conflicts for:', { dateKey, selectedBarber, totalBookings: existingBookings.length });

            existingBookings.forEach(booking => {
                // Ignore cancelled bookings so their time reappears
                if (booking.status === 'cancelled') {
                    return;
                }
                console.log('Checking booking:', {
                    bookingDate: booking.date_key,
                    bookingBarber: booking.barber,
                    startTime: booking.start_time,
                    endTime: booking.end_time
                });

                // Only check conflicts for the same date AND same barber
                if (booking.date_key === dateKey && booking.barber === selectedBarber) {
                    console.log('Found matching booking for conflict check:', booking);
                    const bookingStart = timeToMinutes(booking.start_time);
                    const bookingEnd = timeToMinutes(booking.end_time);

                    // Block all time slots that would conflict with this booking
                    baseSlotsToUse.forEach(slot => {
                        const slotStart = timeToMinutes(slot);
                        const slotEnd = slotStart + (totalDuration || 30); // Default 30min if no services

                        // Check if slot conflicts with existing booking
                        if (slotStart < bookingEnd && bookingStart < slotEnd) {
                            blockedSlots.add(slot);
                            console.log('Blocked slot:', slot, 'due to booking conflict');
                        }
                    });
                }
            });
        }

        // If a time is selected, block the consecutive slots needed
        if (selectedTime) {
            const selectedIndex = timeSlots.indexOf(selectedTime);
            if (selectedIndex !== -1) {
                const slotsNeeded = Math.ceil(totalDuration / 30); // Each slot is 30 minutes

                // Block the selected time and consecutive slots
                for (let i = 0; i < slotsNeeded; i++) {
                    if (selectedIndex + i < timeSlots.length) {
                        blockedSlots.add(timeSlots[selectedIndex + i]);
                    }
                }
            }
        }

        return baseSlotsToUse.filter(slot => {
            // If this slot is blocked by existing bookings, don't show it
            if (blockedSlots.has(slot) && slot !== selectedTime) {
                return false;
            }

            const [hours, minutes] = slot.split(':').map(Number);
            const slotTime = hours * 60 + minutes; // Convert to minutes
            const endTime = slotTime + (totalDuration || 30);

            // If it's today, filter out past times
            if (isToday && slotTime <= currentTimeInMinutes) {
                return false;
            }

            // Check if the service can fit within operating hours (10:00 - 21:00)
            return endTime <= 21 * 60; // 21:00 in minutes
        });
    };

    const getNextAvailableSlots = () => {
        if (!selectedTime) return [];

        const totalDuration = getTotalDuration();
        const selectedIndex = timeSlots.indexOf(selectedTime);
        const slotsNeeded = Math.ceil(totalDuration / 30);
        const nextAvailableIndex = selectedIndex + slotsNeeded;

        // Return available slots after the booking ends
        return timeSlots.slice(nextAvailableIndex).filter(slot => {
            const [hours, minutes] = slot.split(':').map(Number);
            const slotTime = hours * 60 + minutes;
            const endTime = slotTime + totalDuration;
            return endTime <= 21 * 60;
        });
    };

    useEffect(() => {
        // Check authentication first
        const storedData = localStorage.getItem('user');
        if (!storedData) {
            // No user data means not logged in
            console.log('❌ No authentication found, redirecting to login');
            setIsLoading(false);
            router.push('/login');
            return;
        }

        try {
            const userData = JSON.parse(storedData);
            setUserData(userData);
            setIsAuthenticated(true);
            setIsLoading(false);
            console.log('✅ User authenticated:', userData.name || userData.first_name || userData.firstName);
        } catch (error) {
            console.error('❌ Invalid user data, redirecting to login');
            localStorage.removeItem('user');
            setIsLoading(false);
            router.push('/login');
            return;
        }

        // Check for edit mode - if there's a booking to edit
        const editingData = localStorage.getItem('editingBooking');
        if (editingData) {
            try {
                const bookingToEdit = JSON.parse(editingData);
                console.log('📝 Edit mode detected, loading booking:', bookingToEdit);

                setEditingBooking(bookingToEdit);
                setIsEditMode(true);

                // Pre-fill form with existing booking data
                setSelectedBarber(bookingToEdit.barber || '');
                setSelectedServices(bookingToEdit.services || []);

                // Set the date and time
                if (bookingToEdit.date_key) {
                    const [year, month, day] = bookingToEdit.date_key.split('-').map(Number);
                    const editDate = new Date(year, month - 1, day);
                    setSelectedDateObj(editDate);
                }
                if (bookingToEdit.start_time) {
                    setSelectedTime(bookingToEdit.start_time);
                }

                // Clear the editing data from localStorage
                localStorage.removeItem('editingBooking');
                console.log('✅ Edit mode initialized');
            } catch (error) {
                console.error('❌ Error loading editing data:', error);
                localStorage.removeItem('editingBooking');
            }
        }

        // Generate next 30 days for selection
        const dates: Date[] = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        setAvailableDates(dates);

        // Don't set default date - let user choose
        // setSelectedDateObj(today);

        // Load existing bookings from file database
        loadBookingsFromDatabase();

        // Load available barbers from MongoDB
        loadBarbersFromDatabase();

        // Refresh availability every 10 seconds for real-time updates
        const availabilityRefreshInterval = setInterval(() => {
            console.log('🔄 Refreshing barber availabilities...');
            loadBarbersFromDatabase();
        }, 10000); // 10 seconds

        setIsLoading(false);

        return () => clearInterval(availabilityRefreshInterval);
    }, [router]);

    // Effect: Refresh selected barber's availability every 10 seconds if a barber is selected
    useEffect(() => {
        if (!selectedBarber) return;

        const barberRefreshInterval = setInterval(() => {
            console.log(`🔄 Refreshing availability for barber: ${selectedBarber}`);
            loadSingleBarberAvailability(selectedBarber);
        }, 10000); // 10 seconds for selected barber

        return () => clearInterval(barberRefreshInterval);
    }, [selectedBarber]);

    // Load bookings from file database
    const loadBookingsFromDatabase = async () => {
        try {
            const response = await fetch('/api/bookings');
            if (response.ok) {
                const data = await response.json();
                setExistingBookings(data.bookings || []);
                console.log('Loaded bookings from database:', data.bookings?.length || 0);
                console.log('Sample booking format:', data.bookings?.[0]);
            } else {
                console.error('Failed to load bookings from database');
                setExistingBookings([]);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            setExistingBookings([]);
        }
    };

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    // Load accurate Persian dates from API in background
    useEffect(() => {
        if (availableDates.length > 0) {
            // Load accurate dates for the next 10 days immediately
            availableDates.slice(0, 10).forEach(async (date) => {
                const dateKey = date.toDateString();
                if (!persianDateCache[dateKey]) {
                    try {
                        const accurateDate = await getAccuratePersianDate(date);
                        if (accurateDate !== 'در حال بارگذاری...') {
                            setPersianDateCache(prev => ({ ...prev, [dateKey]: accurateDate }));
                        }
                    } catch (error) {
                        console.log('Failed to load accurate date for', dateKey);
                    }
                }
            });
        }
    }, [availableDates, persianDateCache]);

    // Reset selected time and date when barber changes
    useEffect(() => {
        if (selectedBarber) {
            setSelectedTime(''); // Reset time selection when barber changes

            // Check if currently selected date is available for this barber
            if (selectedDateObj && !isBarberAvailableOnDate(selectedBarber, selectedDateObj)) {
                setSelectedDateObj(null); // Reset date if not available for this barber
                setSelectedServices([]); // Also reset services
            }
        }
    }, [selectedBarber, selectedDateObj]);

    // Reset selected time when services change (to refresh available time slots)
    useEffect(() => {
        setSelectedTime('');
    }, [selectedServices]);

    // Convert time string to minutes since midnight
    const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Convert minutes since midnight to time string
    const minutesToTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    // Check if a time slot is blocked by existing bookings
    const isTimeBlocked = (startTime: string, duration: number, selectedDate: Date): boolean => {
        if (!selectedDate || !selectedBarber) return false;

        const dateKey = selectedDate.toISOString().split('T')[0];
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + duration;

        return existingBookings.some(booking => {
            // Ignore cancelled bookings
            if (booking.status === 'cancelled') return false;
            // Only check conflicts for the same date AND same barber
            if (booking.date_key !== dateKey || booking.barber !== selectedBarber) return false;

            const bookingStart = timeToMinutes(booking.start_time);
            const bookingEnd = timeToMinutes(booking.end_time);

            // Check for overlap
            return (startMinutes < bookingEnd && endMinutes > bookingStart);
        });
    };

    // Get available start times for the selected services
    const getAvailableStartTimes = (): string[] => {
        const totalDuration = getTotalDuration();

        // If no services selected, show basic time slots with current time filtering
        if (totalDuration === 0) {
            return getAvailableTimeSlots();
        }

        if (!selectedDateObj) return [];

        // Get all blocked time ranges (excluding the currently selected time)
        const blockedRanges: Array<{ start: number, end: number }> = [];

        // Add existing bookings to blocked ranges (only for the selected barber)
        const dateKey = selectedDateObj.toISOString().split('T')[0];
        existingBookings.forEach(booking => {
            // Ignore cancelled bookings when building blocked ranges
            if (booking.status === 'cancelled') return;
            // Only block times for the same date AND same barber
            if (booking.date_key === dateKey && booking.barber === selectedBarber) {
                blockedRanges.push({
                    start: timeToMinutes(booking.start_time),
                    end: timeToMinutes(booking.end_time)
                });
            }
        });

        const availableTimes = timeSlots.filter(slot => {
            const startMinutes = timeToMinutes(slot);
            const endMinutes = startMinutes + totalDuration;

            // Check if selected date is today
            const isToday = selectedDateObj &&
                selectedDateObj.toDateString() === currentTime.toDateString();

            // If it's today, filter out past times (except selected time)
            if (isToday && slot !== selectedTime) {
                const currentHours = currentTime.getHours();
                const currentMinutes = currentTime.getMinutes();
                const currentTimeInMinutes = currentHours * 60 + currentMinutes;

                if (startMinutes <= currentTimeInMinutes) {
                    return false;
                }
            }

            // Always include the selected time (even if it would normally be filtered out)
            if (slot === selectedTime) {
                return true;
            }

            // Check for flexible off hours (only if barber and date are selected)
            if (selectedBarber && selectedDateObj && isTimeSlotBlocked(selectedBarber, slot, selectedDateObj)) {
                return false; // Time slot is blocked by flexible off hours
            }

            // Check working hours from real availability
            if (selectedBarber && barberAvailabilities[selectedBarber]) {
                const availability = barberAvailabilities[selectedBarber];
                const slotHour = parseInt(slot.split(':')[0]);

                // Check if time is within working hours
                if (slotHour < availability.workingHours.start || slotHour >= availability.workingHours.end) {
                    return false;
                }

                // Check if time is during lunch break
                if (availability.lunchBreak && slotHour >= availability.lunchBreak.start && slotHour < availability.lunchBreak.end) {
                    return false;
                }
            }

            // Check if service fits within operating hours
            if (endMinutes > timeToMinutes('21:00')) return false;

            // Check if this time slot would conflict with existing bookings
            const wouldConflict = blockedRanges.some(blocked => {
                // Two ranges conflict if: startA < endB AND startB < endA
                return startMinutes < blocked.end && blocked.start < endMinutes;
            });

            // If we have a selected time, also check if this slot would conflict with the selected booking
            if (selectedTime) {
                const selectedStart = timeToMinutes(selectedTime);
                const selectedEnd = selectedStart + totalDuration;
                const conflictsWithSelected = startMinutes < selectedEnd && selectedStart < endMinutes;

                if (conflictsWithSelected) {
                    return false;
                }
            }

            return !wouldConflict;
        });

        return availableTimes;
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDateObj || !selectedTime) {
            alert('لطفاً تاریخ و ساعت را انتخاب کنید');
            return;
        }

        if (selectedServices.length === 0) {
            alert('لطفاً حداقل یک سرویس را انتخاب کنید');
            return;
        }

        if (!selectedBarber) {
            alert('لطفاً آرایشگر مورد نظر را انتخاب کنید');
            return;
        }

        // Calculate end time
        const totalDuration = getTotalDuration();
        const startMinutes = timeToMinutes(selectedTime);
        const endMinutes = startMinutes + totalDuration;
        const endTime = minutesToTime(endMinutes);

        // Create booking object for API (with correct field names)
        // Use local date format instead of UTC to avoid timezone issues
        const localDateKey = selectedDateObj.getFullYear() + '-' +
            String(selectedDateObj.getMonth() + 1).padStart(2, '0') + '-' +
            String(selectedDateObj.getDate()).padStart(2, '0');

        const apiBooking = {
            user_id: userData?.phone || 'unknown',
            date_key: localDateKey,
            start_time: selectedTime,
            end_time: endTime,
            barber: selectedBarber,
            services: selectedServices,
            total_duration: totalDuration,
            user_name: userData?.name || userData?.first_name || userData?.username || userData?.phone || 'کاربر',
            user_phone: userData?.phone || '',
            persian_date: formatPersianDateSync(selectedDateObj)
        };

        // Create booking object for localStorage (with legacy field names)
        const localBooking = {
            id: Date.now().toString(),
            dateKey: localDateKey,
            date: formatPersianDateSync(selectedDateObj),
            startTime: selectedTime,
            endTime: endTime,
            services: selectedServices,
            barber: selectedBarber,
            totalDuration: totalDuration,
            userName: userData?.name || userData?.first_name || userData?.username || userData?.phone || 'کاربر',
            phone: userData?.phone || '',
            bookedAt: new Date().toISOString()
        };

        // Save to API/database first
        let bookingSavedToDatabase = false;
        try {
            if (isEditMode && editingBooking) {
                // Update existing booking using PUT method
                console.log('📝 Updating booking:', editingBooking.id);

                const updateData = {
                    id: editingBooking.id,
                    date_key: apiBooking.date_key,
                    start_time: apiBooking.start_time,
                    end_time: apiBooking.end_time,
                    barber: apiBooking.barber,
                    services: apiBooking.services,
                    total_duration: apiBooking.total_duration,
                    user_name: apiBooking.user_name,
                    user_phone: apiBooking.user_phone,
                    persian_date: apiBooking.persian_date,
                    updated_by_user: true, // Flag to indicate user made changes
                    user_updated_at: new Date().toISOString() // Timestamp of user change
                    // Keep existing status and barber approval - no need to re-approve
                };

                const response = await fetch('/api/bookings', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    const responseData = await response.json();
                    console.log('✅ Booking updated successfully');
                    bookingSavedToDatabase = true;
                    alert('رزرو با موفقیت تغییر یافت\n\nآرایشگر باید تغییرات را تأیید کند');
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'خطا در به‌روزرسانی' }));
                    throw new Error(errorData.error || 'Failed to update booking');
                }
            } else {
                // Create new booking
                console.log('📤 Sending booking to API:', apiBooking);
                console.log('📤 Stringified:', JSON.stringify(apiBooking));

                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(apiBooking)
                });

                console.log('📡 API Response status:', response.status);
                console.log('📡 API Response ok:', response.ok);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Booking saved to database successfully:', result);
                    bookingSavedToDatabase = true;

                    // Trigger activity refresh for barber dashboard
                    try {
                        // Send custom event to trigger activity refresh
                        window.dispatchEvent(new CustomEvent('bookingCreated', {
                            detail: { barberId: selectedBarber, bookingId: result._id }
                        }));

                        // Also set localStorage trigger for cross-tab updates
                        localStorage.setItem('newBookingTrigger', Date.now().toString());
                        console.log('🔔 Activity refresh triggered for barber:', selectedBarber);
                    } catch (triggerError) {
                        console.log('⚠️ Failed to trigger activity refresh:', triggerError);
                    }

                    // Send notification to barber
                    try {
                        await fetch('/api/bookings/notify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                barber: selectedBarber,
                                booking: apiBooking
                            })
                        });
                    } catch (notifyError) {
                        console.error('Failed to send notification:', notifyError);
                    }
                } else {
                    const errorData = await response.json();
                    console.error('❌ Failed to save booking to database.');
                    console.error('❌ Status:', response.status);
                    console.error('❌ Error data:', errorData);
                    console.error('❌ Error message:', errorData.error);
                    console.error('❌ Error details:', errorData.details);
                    alert(`رزرو موفقیت آمیز نبود\n${errorData.error || ''}\n${errorData.details || ''}`);
                }
            }
        } catch (error) {
            console.error('❌ Network error saving booking to database:', error);
            console.error('❌ Error type:', error?.name);
            console.error('❌ Error message:', error?.message);
            console.error('❌ Error stack:', error?.stack);
            alert(isEditMode ? `خطا در تغییر رزرو\n${error?.message || ''}` : `رزرو موفقیت آمیز نبود\n${error?.message || ''}`);
        }

        // Only show confirmation if booking was successfully saved to database
        if (bookingSavedToDatabase) {
            // Reload bookings from database to get latest state
            await loadBookingsFromDatabase();

            // Store confirmation details without showing alert
            setBookingConfirmation({
                barber: selectedBarber,
                date: formatPersianDateSync(selectedDateObj),
                time: selectedTime,
                endTime: minutesToTime(timeToMinutes(selectedTime) + getTotalDuration()),
                services: selectedServices,
                totalDuration: getTotalDuration()
            });

            setIsBooked(true);
        } else {
            console.error('❌ Booking was not saved to database, not showing confirmation');
        }
    };

    // Show loading screen while checking authentication
    if (isLoading) {
        return (
            <div className="mobile-full-height flex items-center justify-center mobile-container relative overflow-hidden" dir="rtl">
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
                    <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p>در حال بررسی احراز هویت...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">در حال بررسی احراز هویت...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, return null (user will be redirected)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div
            className="mobile-full-height flex items-center justify-center mobile-container relative overflow-hidden"
            dir="rtl"
            style={{
                backgroundImage: 'url(/picbg2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

            {/* Subtle Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-100/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md glass-card p-6 sm:p-8 floating relative z-10">
                {!isBooked ? (
                    <>
                        <div className="text-center mb-4">
                            <h1 className="text-lg font-bold text-glass mb-1">
                                {isEditMode ? '🔄 تغییر رزرو' : 'رزرو نوبت آرایشگاه'}
                            </h1>
                            <p className="text-glass-secondary text-xs">
                                لطفاً مراحل را به ترتیب تکمیل کنید
                            </p>
                        </div>

                        <form onSubmit={handleBooking} className="space-y-3">
                            {/* Step 1: Barber Selection - Always Active */}
                            <div style={{ marginBottom: '12px' }}>
                                <div className="flex items-center justify-between mb-3">
                                    <label
                                        className="text-sm font-medium text-white"
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#ffffff',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                        }}
                                    >
                                        ✂️ انتخاب آرایشگر
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            console.log('🔄 Manual refresh triggered');
                                            loadBarbersFromDatabase();
                                        }}
                                        className="text-xs text-white/60 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
                                    >
                                        🔄 بروزرسانی
                                    </button>
                                </div>
                                <div
                                    className="grid grid-cols-3 gap-2"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '8px'
                                    }}
                                >
                                    {availableBarbers
                                        .filter((barber) => {
                                            const schedule = getBarberSchedule(barber.name);
                                            const availability = barberAvailabilities[barber.name];

                                            // Log availability data for debugging
                                            console.log(`🔍 Checking barber: ${barber.name}`, {
                                                hasAvailabilityData: !!availability,
                                                isAvailable: availability?.isAvailable,
                                                scheduleIsAvailable: schedule.isAvailable
                                            });

                                            // Hide barbers where isAvailable is explicitly false
                                            if (schedule.isAvailable === false) {
                                                console.log(`🚫 Hiding barber: ${barber.name} (isAvailable: false)`);
                                                return false;
                                            }

                                            console.log(`✅ Showing barber: ${barber.name} (isAvailable: ${schedule.isAvailable})`);
                                            return true;
                                        })
                                        .map((barber) => {
                                            const isSelected = selectedBarber === barber.name;
                                            return (
                                                <button
                                                    key={barber._id || barber.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedBarber(barber.name);
                                                        // Load fresh availability for this barber
                                                        loadSingleBarberAvailability(barber.name);
                                                    }}
                                                    className={`p-3 rounded-2xl text-center backdrop-blur-xl border transition-all duration-300 ${isSelected
                                                        ? 'bg-white/30 text-white border-white/50 shadow-lg'
                                                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {barber.name}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Step 2: Date Selection - Active after barber is selected */}
                            <div style={{
                                marginBottom: '12px',
                                opacity: selectedBarber ? '1' : '0.4',
                                pointerEvents: selectedBarber ? 'auto' : 'none',
                                transform: selectedBarber ? 'scale(1)' : 'scale(0.95)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{
                                        display: 'block',
                                        fontSize: selectedBarber ? '16px' : '12px',
                                        fontWeight: selectedBarber ? '600' : '400',
                                        color: selectedBarber ? '#ffffff' : '#9ca3af',
                                        marginBottom: selectedBarber ? '12px' : '8px',
                                        textShadow: selectedBarber ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    📅 انتخاب تاریخ
                                </label>

                                {/* Today and Tomorrow - Filtered by barber availability */}
                                <div
                                    className="grid grid-cols-2 gap-2 mb-3"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '8px',
                                        marginBottom: '12px',
                                        transform: selectedBarber ? 'scale(1)' : 'scale(0.98)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    {(() => {
                                        // Filter dates based on barber availability
                                        const filteredDates = [];
                                        let dateIndex = 0;

                                        while (filteredDates.length < 2 && dateIndex < availableDates.length) {
                                            const date = availableDates[dateIndex];

                                            // If no barber selected, show all dates
                                            if (!selectedBarber) {
                                                filteredDates.push({ date, index: dateIndex });
                                            } else {
                                                // Check if barber is available on this date
                                                if (isBarberAvailableOnDate(selectedBarber, date)) {
                                                    filteredDates.push({ date, index: dateIndex });
                                                }
                                            }
                                            dateIndex++;
                                        }

                                        return filteredDates.map(({ date, index }) => {
                                            const isSelected = selectedDateObj?.getTime() === date.getTime();
                                            const persianDate = formatPersianDateSync(date);

                                            // Determine label based on actual date position
                                            let label;
                                            if (index === 0) {
                                                label = 'امروز';
                                            } else if (index === 1) {
                                                label = 'فردا';
                                            } else if (index === 2) {
                                                label = 'پس فردا';
                                            } else {
                                                label = persianDate.split(' ')[0]; // Use day name
                                            }

                                            return (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => setSelectedDateObj(date)}
                                                    className={`p-3 rounded-xl text-xs text-center transition-all ${isSelected
                                                        ? 'bg-white/30 text-white border-white/50 shadow-lg'
                                                        : 'bg-white/5 text-white/60 border-white/10'
                                                        }`}
                                                >
                                                    <div className="font-semibold mb-1">
                                                        {label}
                                                    </div>
                                                    <div className="text-xs opacity-80">
                                                        {persianDate}
                                                    </div>
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* 4 Future Days - Filtered by barber availability */}
                                <div
                                    className="grid grid-cols-4 gap-1"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '4px',
                                        transform: selectedBarber ? 'scale(1)' : 'scale(0.98)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    {(() => {
                                        // Filter future dates based on barber availability
                                        const filteredFutureDates = [];
                                        let dateIndex = 2; // Start from day 3 (after today and tomorrow)

                                        while (filteredFutureDates.length < 4 && dateIndex < availableDates.length) {
                                            const date = availableDates[dateIndex];

                                            // If no barber selected, show all dates
                                            if (!selectedBarber) {
                                                filteredFutureDates.push({ date, originalIndex: dateIndex });
                                            } else {
                                                // Check if barber is available on this date
                                                if (isBarberAvailableOnDate(selectedBarber, date)) {
                                                    filteredFutureDates.push({ date, originalIndex: dateIndex });
                                                }
                                            }
                                            dateIndex++;
                                        }

                                        return filteredFutureDates.map(({ date, originalIndex }, index) => {
                                            const isSelected = selectedDateObj?.getTime() === date.getTime();
                                            const persianDate = formatPersianDateSync(date);
                                            return (
                                                <button
                                                    key={originalIndex}
                                                    type="button"
                                                    onClick={() => setSelectedDateObj(date)}
                                                    className={`p-2 rounded-lg text-xs text-center transition-all ${isSelected
                                                        ? 'bg-white/30 text-white border-white/50 shadow-lg'
                                                        : 'bg-white/5 text-white/60 border-white/10'
                                                        }`}
                                                    style={{
                                                        padding: '6px',
                                                        fontSize: '10px',
                                                        lineHeight: '1.2'
                                                    }}
                                                >
                                                    <div className="font-medium mb-0.5">
                                                        {persianDate.split(' ')[0]}
                                                    </div>
                                                    <div className="text-xs opacity-70">
                                                        {persianDate.split(' ')[1]} {persianDate.split(' ')[2]}
                                                    </div>
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Step 3: Service Selection - Active after date is selected */}
                            <div style={{
                                marginBottom: '12px',
                                opacity: selectedDateObj ? '1' : '0.4',
                                pointerEvents: selectedDateObj ? 'auto' : 'none',
                                transform: selectedDateObj ? 'scale(1)' : 'scale(0.95)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{
                                        display: 'block',
                                        fontSize: selectedDateObj ? '16px' : '12px',
                                        fontWeight: selectedDateObj ? '600' : '400',
                                        color: selectedDateObj ? '#ffffff' : '#9ca3af',
                                        marginBottom: selectedDateObj ? '12px' : '8px',
                                        textShadow: selectedDateObj ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    🎯 انتخاب سرویس
                                </label>
                                {/* VIP Service - Full Row */}
                                <div
                                    style={{
                                        marginBottom: '8px',
                                        transform: selectedDateObj ? 'scale(1)' : 'scale(0.98)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    {services.slice(0, 1).map((service) => {
                                        const isSelected = selectedServices.includes(service.name);
                                        return (
                                            <button
                                                key={service.name}
                                                type="button"
                                                onClick={() => selectedDateObj ? handleServiceToggle(service.name) : null}
                                                className={`w-full p-3 rounded-2xl text-right backdrop-blur-xl border transition-all duration-300 ${isSelected
                                                    ? 'bg-white/30 text-white border-white/50 shadow-lg'
                                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                                    }`}
                                                style={{ fontSize: '13px' }}
                                            >
                                                {service.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Other Services - 2 Column Grid */}
                                <div
                                    className="grid grid-cols-2 gap-2"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '8px',
                                        transform: selectedDateObj ? 'scale(1)' : 'scale(0.98)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    {services.slice(1).map((service) => {
                                        const isSelected = selectedServices.includes(service.name);
                                        return (
                                            <button
                                                key={service.name}
                                                type="button"
                                                onClick={() => selectedDateObj ? handleServiceToggle(service.name) : null}
                                                className={`p-3 rounded-2xl text-right backdrop-blur-xl border transition-all duration-300 ${isSelected
                                                    ? 'bg-white/30 text-white border-white/50 shadow-lg'
                                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                                    }`}
                                                style={{ fontSize: '12px' }}
                                            >
                                                {service.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 4: Time Selection or Phone Number - Active after service is selected */}
                            <div style={{
                                marginBottom: '24px',
                                opacity: selectedServices.length > 0 ? '1' : '0.4',
                                pointerEvents: selectedServices.length > 0 ? 'auto' : 'none',
                                transform: selectedServices.length > 0 ? 'scale(1)' : 'scale(0.95)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                {selectedServices.includes('حالت') ? (
                                    /* Phone Number Display for حالت */
                                    <div className="text-center p-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20">
                                        <label
                                            className="block text-sm font-medium mb-3"
                                            style={{
                                                display: 'block',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#ffffff',
                                                marginBottom: '12px',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            📞 تماس با آرایشگاه
                                        </label>
                                        <div className="text-white/90 text-lg font-semibold mb-2">
                                            02144763886

                                        </div>
                                        <div className="text-white/70 text-sm">
                                            لطفاً تماس بگیرید
                                        </div>
                                    </div>
                                ) : (
                                    /* Regular Time Selection */
                                    <>
                                        <label
                                            className="block text-sm font-medium mb-2"
                                            style={{
                                                display: 'block',
                                                fontSize: selectedServices.length > 0 ? '16px' : '12px',
                                                fontWeight: selectedServices.length > 0 ? '600' : '400',
                                                color: selectedServices.length > 0 ? '#ffffff' : '#9ca3af',
                                                marginBottom: selectedServices.length > 0 ? '12px' : '8px',
                                                textShadow: selectedServices.length > 0 ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            ⏰ انتخاب ساعت
                                        </label>

                                        {/* First row of times - Always visible */}
                                        <div
                                            className="grid grid-cols-3 gap-2 mb-3"
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '8px',
                                                marginBottom: '12px',
                                                transform: selectedServices.length > 0 ? 'scale(1)' : 'scale(0.98)',
                                                transition: 'transform 0.3s ease'
                                            }}
                                        >
                                            {getAvailableStartTimes().slice(0, 3).map((time) => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`p-3 rounded-2xl text-sm backdrop-blur-xl border transition-all duration-300 ${selectedTime === time
                                                        ? 'bg-white/30 text-white border-white/50 shadow-lg'
                                                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Toggle button for more rows */}
                                        {getAvailableStartTimes().length > 3 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllTimeSlots(!showAllTimeSlots)}
                                                className="w-full p-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 text-white text-sm flex items-center justify-center mb-2"
                                            >
                                                <span style={{ marginLeft: '4px' }}>
                                                    {showAllTimeSlots ? 'بستن' : 'مشاهده ساعت‌های بیشتر'}
                                                </span>
                                                <span
                                                    style={{
                                                        transform: showAllTimeSlots ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s',
                                                        fontSize: '10px'
                                                    }}
                                                >
                                                    ▼
                                                </span>
                                            </button>
                                        )}

                                        {/* Additional rows - Collapsible */}
                                        {showAllTimeSlots && getAvailableStartTimes().length > 3 && (
                                            <div
                                                className="grid grid-cols-3 gap-2"
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: '8px'
                                                }}
                                            >
                                                {getAvailableStartTimes().slice(3).map((time) => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => setSelectedTime(time)}
                                                        className={`p-3 rounded-2xl text-sm backdrop-blur-xl border transition-all duration-300 ${selectedTime === time
                                                            ? 'bg-white/30 text-white border-white/50 shadow-lg'
                                                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Show exact booking times */}
                                        {selectedServices.length > 0 && getAvailableStartTimes().length > 0 && (
                                            <p
                                                className="mt-2 text-xs text-white/70 text-center"
                                                style={{
                                                    marginTop: '8px',
                                                    fontSize: '11px',
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {getAvailableStartTimes().length} زمان آزاد موجود است
                                            </p>
                                        )}

                                        {/* Show no available times message */}
                                        {selectedServices.length > 0 && getAvailableStartTimes().length === 0 && (
                                            <p
                                                className="mt-2 text-xs text-red-600 text-center"
                                                style={{
                                                    marginTop: '8px',
                                                    fontSize: '11px',
                                                    color: '#dc2626',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {selectedBarber && selectedDateObj && !isBarberAvailableOnDate(selectedBarber, selectedDateObj)
                                                    ? `${selectedBarber} در این روز تعطیل است`
                                                    : 'در این تاریخ زمان آزادی برای سرویس‌های انتخابی وجود ندارد'
                                                }
                                            </p>
                                        )}

                                        {/* Show message when no services selected */}
                                        {selectedServices.length === 0 && (
                                            <p
                                                className="mt-2 text-xs text-gray-500 text-center"
                                                style={{
                                                    marginTop: '8px',
                                                    fontSize: '11px',
                                                    color: '#6b7280',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                ابتدا سرویس‌های مورد نظر را انتخاب کنید تا زمان‌های دقیق نمایش داده شود
                                            </p>
                                        )}

                                        {/* Show time range if service selected */}
                                        {selectedServices.length > 0 && selectedTime && (
                                            <div
                                                className="mt-2 p-2 bg-white/10 rounded text-center text-xs backdrop-blur-sm border border-white/20"
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '8px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '4px',
                                                    textAlign: 'center',
                                                    fontSize: '11px',
                                                    color: 'rgba(255, 255, 255, 0.9)'
                                                }}
                                            >
                                                زمان رزرو: {selectedTime} تا {minutesToTime(timeToMinutes(selectedTime) + getTotalDuration())}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!selectedBarber || !selectedDateObj || selectedServices.length === 0 || (!selectedTime && !selectedServices.includes('حالت'))}
                                className={`w-full p-4 rounded-2xl font-medium backdrop-blur-xl border transition-all duration-300 shadow-xl ${selectedBarber && selectedDateObj && selectedServices.length > 0 && (selectedTime || selectedServices.includes('حالت'))
                                    ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white cursor-pointer'
                                    : 'bg-white/5 border-white/10 text-white/50 cursor-not-allowed'
                                    }`}
                            >
                                {selectedBarber && selectedDateObj && selectedServices.length > 0 && (selectedTime || selectedServices.includes('حالت'))
                                    ? 'ثبت رزرو'
                                    : 'لطفاً تمام مراحل را تکمیل کنید'
                                }
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        {/* Success Icon */}
                        <div className="mb-6">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-green-500/30">
                                <span className="text-4xl text-green-600">✓</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">
                                🎉 درخواست رزرو شما ثبت شد!
                            </h2>
                            <p className="text-white/80 text-sm mb-6">
                                رزرو شما با موفقیت ثبت شد. لطفا منتظر تأیید آرایشگر باشید.
                            </p>
                        </div>

                        {/* Booking Details in Glass Container */}
                        <div className="glass-card p-6 mb-6 text-right">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                📋 جزئیات رزرو شما
                            </h3>
                            <div className="space-y-3 text-white/90">
                                <div className="flex justify-between items-center">
                                    <span className="text-white/70">📅 تاریخ:</span>
                                    <span className="font-medium">{bookingConfirmation?.date}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/70">⏰ ساعت:</span>
                                    <span className="font-medium">{bookingConfirmation?.time} تا {bookingConfirmation?.endTime}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/70">✂️ آرایشگر:</span>
                                    <span className="font-medium">{bookingConfirmation?.barber}</span>
                                </div>
                                <div className="border-t border-white/20 pt-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white/70">🎯 سرویس‌ها:</span>
                                        <span className="text-sm text-white/60">({bookingConfirmation?.totalDuration} دقیقه)</span>
                                    </div>
                                    <div className="space-y-1">
                                        {bookingConfirmation?.services?.map((serviceName: string, index: number) => {
                                            const service = services.find(s => s.name === serviceName);
                                            return (
                                                <div key={index} className="flex justify-between items-center text-sm">
                                                    <span className="text-white/80">• {serviceName}</span>
                                                    <span className="text-white/60">{service?.duration} دقیقه</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Link
                                href="/dashboard"
                                className="block w-full glass-button text-center py-3 px-6 rounded-xl font-medium transition-all hover:bg-white/20"
                            >
                                📊 مشاهده داشبورد
                            </Link>
                            <Link
                                href="/"
                                className="block w-full glass-secondary text-center py-3 px-6 rounded-xl font-medium transition-all hover:bg-white/10"
                            >
                                🏠 بازگشت به صفحه اصلی
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
