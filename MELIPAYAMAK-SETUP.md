# Melipayamak SMS Setup for HRD Barber Shop

## SMS API Configuration

### Credentials:
- **Username**: `hrd`
- **Password**: `hrddatabase`
- **Sender Number**: `10008663`

## Setup Steps:

1. **Create Melipayamak Account**:
   - Go to https://melipayamak.com
   - Sign up for account
   - Verify your phone number

2. **Get API Credentials**:
   - Go to API section
   - Create new API key
   - Username: `hrd`
   - Password: `hrddatabase`

3. **Register Sender Number**:
   - Go to Sender Numbers
   - Add your number: `10008663`
   - Verify the number

4. **Test SMS**:
   - Use the test endpoint
   - Send test OTP to your number
   - Verify it works

## API Endpoint Used:
```
https://console.melipayamak.com/api/send/otp/25085e67e97342aa886f9fdf12117341
```

## Features:
- OTP sending for user registration
- OTP sending for password reset
- SMS notifications for bookings (future feature)

## Cost:
- Check Melipayamak pricing
- Usually very affordable for SMS
- Pay per SMS sent

## Troubleshooting:
- Check API credentials
- Verify sender number
- Check account balance
- Test with different numbers
