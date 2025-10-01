// API endpoint for sending booking notifications to barbers
export async function POST(request) {
    try {
        const { barber, booking } = await request.json();
        
        console.log(`📢 New booking notification for barber: ${barber}`);
        console.log('Booking details:', booking);
        
        // For now, we'll log the notification
        // In the future, this can be extended to:
        // 1. Send SMS notifications via Melipayamak
        // 2. Send web push notifications
        // 3. Send email notifications
        
        const notificationMessage = `
رزرو جدید!
آرایشگر: ${barber}
مشتری: ${booking.user_name}
تاریخ: ${booking.persian_date}
ساعت: ${booking.start_time} - ${booking.end_time}
سرویس‌ها: ${booking.services.join(', ')}
تلفن: ${booking.user_phone}
        `.trim();
        
        console.log('Notification message:', notificationMessage);
        
        // If you want to add SMS notification, uncomment and configure:
        /*
        try {
            const smsResponse = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: process.env.MELIPAYAMAK_USERNAME,
                    password: process.env.MELIPAYAMAK_PASSWORD,
                    to: getBarberPhone(barber), // You'll need to implement this
                    from: process.env.MELIPAYAMAK_NUMBER,
                    text: notificationMessage,
                    isFlash: false
                })
            });
            
            if (smsResponse.ok) {
                console.log('✅ SMS notification sent successfully');
            }
        } catch (smsError) {
            console.error('❌ Failed to send SMS:', smsError);
        }
        */
        
        return Response.json({ 
            success: true, 
            message: 'Notification logged successfully' 
        });
        
    } catch (error) {
        console.error('Error in notification endpoint:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

