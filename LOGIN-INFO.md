# HRD Barber Shop - Login Information

## Regular Users
Regular users should login with:
- **Username**: Their phone number
- **Password**: The password they set during signup

## Barbers
Barbers should login with:
- **Username**: Their romanized/English name
- **Password**: Their romanized/English name + "123"

Current barber accounts:
1. **حمید (Hamid)**
   - Username: hamid
   - Password: hamid123

2. **بنیامین (Benyamin)**
   - Username: benyamin
   - Password: benyamin123

3. **محمد (Mohammad)**
   - Username: mohammad
   - Password: mohammad123

## CEO/Admin
- **Username**: ceo
- **Password**: instad

## Instructions for Logging In
1. Go to the login page
2. **For regular users**: Enter your phone number and password
3. **For barbers**: Enter your English username (e.g., "hamid") and password (e.g., "hamid123")
4. **For CEO/admin**: Enter "ceo" as username and "instad" as password

## Troubleshooting Login Issues
- Make sure you're using the correct username format (phone number for users, English name for barbers)
- If you see "خطا در اتصال" (Connection Error), check your internet connection
- Check that you're using the correct password
- If persistent issues occur, try clearing your browser cache or using a different browser

## Notes
- If you add new barbers to the system, you need to run the create-accounts.js script to generate their authentication accounts
- The login system first tries to authenticate with the API, then falls back to localStorage if that fails
- Password authentication is a simple comparison, not using hashing (this should be improved in a production environment)
