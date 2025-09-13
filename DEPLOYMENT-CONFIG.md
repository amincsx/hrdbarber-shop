# 🚀 PRODUCTION DEPLOYMENT CONFIGURATION

## Environment Variables Required in Liara Dashboard

Add these environment variables in your Liara dashboard:

### Required Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrdbarber
NODE_ENV=production
SKIP_ENV_VALIDATION=true
TSC_COMPILE_ON_ERROR=true
DISABLE_ESLINT=true
```

### Alternative Variable Names (if MONGODB_URI doesn't work):
```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/hrdbarber
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/hrdbarber
```

## How to Set Environment Variables in Liara:

1. Go to your Liara dashboard
2. Select your app
3. Go to "Environment Variables" section
4. Add each variable with its value
5. Save and redeploy

## MongoDB Setup:

1. Create a MongoDB Atlas account (free tier available)
2. Create a new cluster
3. Create a database user
4. Whitelist IP addresses (use 0.0.0.0/0 for all IPs)
5. Get the connection string
6. Replace `<username>`, `<password>`, and `<cluster>` in the connection string

## Testing After Deployment:

1. Go to your production URL
2. Try logging in with: `user` / `pass`
3. Try signing up with a new account
4. Check Liara logs for any errors

## Troubleshooting:

- If authentication still fails, check Liara logs
- Ensure MongoDB connection string is correct
- Verify MongoDB network access allows all IPs
- Test API endpoints directly: `https://your-app.liara.run/api/auth?phone=user&password=pass`
