# Liara Deployment Guide for HRD Barber Shop

## Environment Variables for Liara

Copy these environment variables to your Liara dashboard:

### Required Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrdbarber?retryWrites=true&w=majority
NEXTAUTH_URL=https://your-app-name.liara.run
NEXTAUTH_SECRET=your-secure-random-string-here
API_BASE_URL=https://your-app-name.liara.run
MELIPAYAMAK_USERNAME=your-melipayamak-username
MELIPAYAMAK_PASSWORD=your-melipayamak-password
MELIPAYAMAK_FROM=your-sender-number
NODE_ENV=production
```

### How to Get Each Variable:

1. **MONGODB_URI**: 
   - Go to MongoDB Atlas
   - Create a cluster
   - Get connection string
   - Replace `<username>`, `<password>`, and `<dbname>` with your values

2. **NEXTAUTH_URL**: 
   - Your Liara app URL (e.g., `https://hrdbarber.liara.run`)

3. **NEXTAUTH_SECRET**: 
   - Generate a random string: `openssl rand -base64 32`

4. **MELIPAYAMAK_***: 
   - Get from Melipayamak dashboard
   - Username and password for SMS API
   - Sender number (usually your registered number)

## Deployment Steps:

1. **Connect Repository**:
   - Go to Liara dashboard
   - Create new app
   - Connect your GitHub repository

2. **Set Environment Variables**:
   - Go to Environment tab
   - Add all variables above

3. **Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Node Version: 18.x or 20.x

4. **Deploy**:
   - Click Deploy
   - Wait for build to complete

## Database Setup:

1. **MongoDB Atlas**:
   - Create cluster
   - Add your IP to whitelist (or use 0.0.0.0/0 for all IPs)
   - Create database user
   - Get connection string

2. **Collections**:
   - The app will create collections automatically:
     - `users` - User accounts
     - `barbers` - Barber information
     - `bookings` - Booking records

## SMS Configuration:

1. **Melipayamak**:
   - Register at melipayamak.com
   - Get API credentials
   - Add sender number
   - Test SMS sending

## Troubleshooting:

- **Build Fails**: Check Node version and dependencies
- **Database Connection**: Verify MongoDB URI and network access
- **SMS Not Working**: Check Melipayamak credentials
- **Authentication Issues**: Verify NEXTAUTH_SECRET and URL

## Security Notes:

- Never commit `.env` files to repository
- Use strong passwords for database
- Enable MongoDB authentication
- Use HTTPS in production
- Regularly update dependencies
