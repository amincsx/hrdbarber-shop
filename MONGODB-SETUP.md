# MongoDB Atlas Setup for HRD Barber Shop

## Database Configuration

### Connection String:
```
mongodb+srv://hrd:hrddatabase@cluster0.mongodb.net/hrdbarber?retryWrites=true&w=majority
```

### Database Details:
- **Database Name**: `hrdbarber`
- **Username**: `hrd`
- **Password**: `hrddatabase`
- **Cluster**: `cluster0`

## Setup Steps:

1. **Create MongoDB Atlas Account**:
   - Go to https://cloud.mongodb.com
   - Sign up for free account

2. **Create Cluster**:
   - Choose "M0 Sandbox" (free tier)
   - Select region closest to Iran
   - Name it `cluster0`

3. **Create Database User**:
   - Go to Database Access
   - Add New User
   - Username: `hrd`
   - Password: `hrddatabase`
   - Role: `Read and write to any database`

4. **Network Access**:
   - Go to Network Access
   - Add IP Address
   - Add `0.0.0.0/0` (allow from anywhere) for Liara deployment

5. **Get Connection String**:
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with `hrddatabase`
   - Replace `<dbname>` with `hrdbarber`

## Collections (Auto-created):

The app will automatically create these collections:

1. **users** - User accounts and profiles
2. **barbers** - Barber information and schedules
3. **bookings** - Booking records and appointments

## Security Notes:

- Change the password in production
- Use environment variables
- Enable MongoDB authentication
- Regular backups recommended
