'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    const [userData, setUserData] = useState<any>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
    const [isBooked, setIsBooked] = useState(false);
    const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
    const [persianDateCache, setPersianDateCache] = useState<{ [key: string]: string }>({});
    const [currentTime, setCurrentTime] = useState(new Date()); // Add current time state

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
    const [showMoreDates, setShowMoreDates] = useState(false);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [existingBookings, setExistingBookings] = useState<any[]>([]);
    const [showAllTimeSlots, setShowAllTimeSlots] = useState(false);
    const [selectedBarber, setSelectedBarber] = useState<string>('');

    // Generate all possible time slots (every 15 minutes from 10:00 to 21:00)
    const generateAllTimeSlots = () => {
        const slots = [];
        for (let hour = 10; hour <= 20; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                if (hour === 20 && minute > 45) break; // Stop at 20:45 to allow 15min service until 21:00
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeStr);
            }
        }
        // Add 21:00 as final slot
        slots.push('21:00');
        return slots;
    };

    const allTimeSlots = generateAllTimeSlots();

    // Basic 30-minute slots for display when no services selected
    const timeSlots = [
        '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
        '19:00', '19:30', '20:00', '20:30', '21:00'
    ];

    const services = [
        { name: 'اصلاح سر', duration: 30 },
        { name: 'اصلاح صورت', duration: 15 },
        { name: 'حالت مو', duration: 15 },
        { name: 'کراتین', duration: 30 },
        { name: 'فیشیال', duration: 30 }
    ];

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
                return [...prev, serviceName];
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

        const baseSlotsToUse = totalDuration === 0 ? timeSlots : timeSlots;
        const blockedSlots = new Set<string>();

        // Get existing bookings for selected date to block conflicting times
        if (selectedDateObj) {
            const dateKey = selectedDateObj.toISOString().split('T')[0];
            existingBookings.forEach(booking => {
                if (booking.dateKey === dateKey) {
                    const bookingStart = timeToMinutes(booking.startTime);
                    const bookingEnd = timeToMinutes(booking.endTime);

                    // Block all time slots that would conflict with this booking
                    baseSlotsToUse.forEach(slot => {
                        const slotStart = timeToMinutes(slot);
                        const slotEnd = slotStart + (totalDuration || 30); // Default 30min if no services

                        // Check if slot conflicts with existing booking
                        if (slotStart < bookingEnd && bookingStart < slotEnd) {
                            blockedSlots.add(slot);
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
        // Get user data from localStorage
        const storedData = localStorage.getItem('userData');
        if (storedData) {
            setUserData(JSON.parse(storedData));
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

        // Set today as default selected date
        setSelectedDateObj(today);

        // Load existing bookings from localStorage (simulate database)
        const bookings = localStorage.getItem('allBookings');
        if (bookings) {
            setExistingBookings(JSON.parse(bookings));
        }
    }, []);

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
        if (!selectedDate) return false;

        const dateKey = selectedDate.toISOString().split('T')[0];
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + duration;

        return existingBookings.some(booking => {
            if (booking.dateKey !== dateKey) return false;

            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = timeToMinutes(booking.endTime);

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

        // Add existing bookings to blocked ranges
        const dateKey = selectedDateObj.toISOString().split('T')[0];
        existingBookings.forEach(booking => {
            if (booking.dateKey === dateKey) {
                blockedRanges.push({
                    start: timeToMinutes(booking.startTime),
                    end: timeToMinutes(booking.endTime)
                });
            }
        });

        const availableTimes = allTimeSlots.filter(slot => {
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

        // Create booking object
        const newBooking = {
            id: Date.now().toString(),
            dateKey: selectedDateObj.toISOString().split('T')[0],
            date: formatPersianDateSync(selectedDateObj),
            startTime: selectedTime,
            endTime: endTime,
            services: selectedServices,
            barber: selectedBarber,
            totalDuration: totalDuration,
            userName: userData?.firstName || 'کاربر',
            phone: userData?.phone || '',
            bookedAt: new Date().toISOString()
        };

        // Save to API/database
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newBooking)
            });

            if (response.ok) {
                console.log('Booking saved to database successfully');
            } else {
                console.error('Failed to save booking to database');
            }
        } catch (error) {
            console.error('Error saving booking:', error);
        }

        // Save to individual user booking (backup)
        localStorage.setItem('bookingData', JSON.stringify(newBooking));

        // Save to shared bookings list (backup)
        const existingBookingsData = localStorage.getItem('allBookings');
        const allBookings = existingBookingsData ? JSON.parse(existingBookingsData) : [];
        allBookings.push(newBooking);
        localStorage.setItem('allBookings', JSON.stringify(allBookings));

        // Update local state
        setExistingBookings(allBookings);

        // Store confirmation details instead of showing alert
        setBookingConfirmation({
            barber: selectedBarber,
            date: formatPersianDateSync(selectedDateObj),
            time: selectedTime,
            endTime: minutesToTime(timeToMinutes(selectedTime) + getTotalDuration()),
            services: selectedServices,
            totalDuration: getTotalDuration()
        });

        setIsBooked(true);
    };

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
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-2xl text-glass">✂️</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-glass mb-2">
                                رزرو نوبت آرایشگاه
                            </h1>
                            <p className="text-glass-secondary text-sm">
                                لطفاً تاریخ، آرایشگر و سرویس‌های مورد نظر خود را انتخاب کنید
                            </p>
                        </div>

                        <form onSubmit={handleBooking} className="space-y-4">
                            <div style={{ marginBottom: '16px' }}>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                    style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        marginBottom: '8px'
                                    }}
                                >
                                    انتخاب تاریخ
                                </label>

                                {/* Today and Tomorrow - Always visible */}
                                <div
                                    className="grid grid-cols-2 gap-2 mb-3"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '8px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    {availableDates.slice(0, 2).map((date, index) => {
                                        const isSelected = selectedDateObj?.getTime() === date.getTime();
                                        const persianDate = formatPersianDateSync(date);
                                        const label = index === 0 ? 'امروز' : 'فردا';
                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setSelectedDateObj(date)}
                                                className={`p-3 rounded-xl text-xs text-center transition-all ${isSelected
                                                    ? 'glass-button'
                                                    : 'glass-secondary'
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
                                    })}
                                </div>

                                {/* Toggle button for more dates */}
                                <button
                                    type="button"
                                    onClick={() => setShowMoreDates(!showMoreDates)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        backgroundColor: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: showMoreDates ? '8px' : '0'
                                    }}
                                >
                                    <span style={{ marginLeft: '4px' }}>
                                        {showMoreDates ? 'بستن' : 'مشاهده روزهای بیشتر'}
                                    </span>
                                    <span
                                        style={{
                                            transform: showMoreDates ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                            fontSize: '10px'
                                        }}
                                    >
                                        ▼
                                    </span>
                                </button>

                                {/* Other dates - Collapsible */}
                                {showMoreDates && (
                                    <div
                                        className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mt-2"
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(2, 1fr)',
                                            gap: '8px',
                                            maxHeight: '192px',
                                            overflowY: 'auto',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '4px',
                                            padding: '8px',
                                            marginTop: '8px'
                                        }}
                                    >
                                        {availableDates.slice(2).map((date, index) => {
                                            const isSelected = selectedDateObj?.getTime() === date.getTime();
                                            const persianDate = formatPersianDateSync(date);
                                            return (
                                                <button
                                                    key={index + 2}
                                                    type="button"
                                                    onClick={() => setSelectedDateObj(date)}
                                                    className={`p-2 border rounded text-xs text-right ${isSelected
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                                                        }`}
                                                    style={{
                                                        padding: '8px',
                                                        border: isSelected ? '1px solid black' : '1px solid #d1d5db',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        backgroundColor: isSelected ? 'black' : 'white',
                                                        color: isSelected ? 'white' : '#374151',
                                                        cursor: 'pointer',
                                                        textAlign: 'right',
                                                        lineHeight: '1.2'
                                                    }}
                                                >
                                                    {persianDate}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Barber Selection */}
                            <div style={{ marginBottom: '16px' }}>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                    style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        marginBottom: '8px'
                                    }}
                                >
                                    انتخاب آرایشگر
                                </label>
                                <div
                                    className="grid grid-cols-3 gap-2"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '8px'
                                    }}
                                >
                                    {['حمید', 'بنیامین', 'محمد'].map((barber) => {
                                        const isSelected = selectedBarber === barber;
                                        return (
                                            <button
                                                key={barber}
                                                type="button"
                                                onClick={() => setSelectedBarber(barber)}
                                                className={`p-2 border rounded-md text-center ${isSelected
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                                                    }`}
                                                style={{
                                                    padding: '10px 8px',
                                                    border: isSelected ? '1px solid black' : '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    backgroundColor: isSelected ? 'black' : 'white',
                                                    color: isSelected ? 'white' : '#374151',
                                                    cursor: 'pointer',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {barber}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Service Selection */}
                            <div style={{ marginBottom: '16px' }}>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                    style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        marginBottom: '8px'
                                    }}
                                >
                                    انتخاب سرویس
                                </label>
                                <div
                                    className="grid grid-cols-2 gap-2"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '8px'
                                    }}
                                >
                                    {services.map((service) => {
                                        const isSelected = selectedServices.includes(service.name);
                                        return (
                                            <button
                                                key={service.name}
                                                type="button"
                                                onClick={() => handleServiceToggle(service.name)}
                                                className={`p-3 border rounded-md text-right ${isSelected
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                                                    }`}
                                                style={{
                                                    padding: '10px 8px',
                                                    border: isSelected ? '1px solid black' : '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    backgroundColor: isSelected ? 'black' : 'white',
                                                    color: isSelected ? 'white' : '#374151',
                                                    cursor: 'pointer',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {service.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                    style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        marginBottom: '8px'
                                    }}
                                >
                                    انتخاب ساعت
                                </label>

                                {/* First row of times - Always visible */}
                                <div
                                    className="grid grid-cols-3 gap-2 mb-3"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '8px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    {getAvailableStartTimes().slice(0, 3).map((time) => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => setSelectedTime(time)}
                                            className={`p-2 border rounded text-sm ${selectedTime === time
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                                                }`}
                                            style={{
                                                padding: '8px',
                                                border: selectedTime === time ? '1px solid black' : '1px solid #d1d5db',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                backgroundColor: selectedTime === time ? 'black' : 'white',
                                                color: selectedTime === time ? 'white' : '#374151',
                                                cursor: 'pointer'
                                            }}
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
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center mb-2"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            backgroundColor: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '8px'
                                        }}
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
                                                className={`p-2 border rounded text-sm ${selectedTime === time
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                                                    }`}
                                                style={{
                                                    padding: '8px',
                                                    border: selectedTime === time ? '1px solid black' : '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: selectedTime === time ? 'black' : 'white',
                                                    color: selectedTime === time ? 'white' : '#374151',
                                                    cursor: 'pointer'
                                                }}
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
                                        در این تاریخ زمان آزادی برای سرویس‌های انتخابی وجود ندارد
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
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 font-medium"
                                style={{
                                    width: '100%',
                                    backgroundColor: 'black',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    fontWeight: '500',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                رزرو نوبت
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
                                🎉 نوبت شما رزرو شد!
                            </h2>
                            <p className="text-white/80 text-sm mb-6">
                                رزرو شما با موفقیت ثبت شد. منتظر دیدار شما هستیم!
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
