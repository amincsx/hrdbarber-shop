# 🚀 LIARA ENVIRONMENT VARIABLES SETUP

## Method 1: Using liara.json (Recommended)

I've updated your `liara.json` file to include environment variables. This should work automatically when you push to GitHub.

## Method 2: Liara CLI (If you have access)

If you have Liara CLI installed, you can set environment variables using:

```bash
# Install Liara CLI
npm install -g @liara/cli

# Login to Liara
liara login

# Set environment variables
liara env:set MONGODB_URI "mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@hrddatabase:27017/my-app?authSource=admin"
liara env:set NODE_ENV "production"
liara env:set SKIP_ENV_VALIDATION "true"
liara env:set TSC_COMPILE_ON_ERROR "true"
liara env:set DISABLE_ESLINT "true"
```

## Method 3: Liara Web Console

1. Go to [Liara Console](https://console.liara.ir/)
2. Select your app (`hrdbarber-shop`)
3. Go to "Environment Variables" section
4. Add these variables:

```
MONGODB_URI=mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@hrddatabase:27017/my-app?authSource=admin
NODE_ENV=production
SKIP_ENV_VALIDATION=true
TSC_COMPILE_ON_ERROR=true
DISABLE_ESLINT=true
```

## Method 4: GitHub Secrets (Alternative)

If Liara supports GitHub secrets, you can add them in your GitHub repository:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add repository secrets:

```
MONGODB_URI=mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@hrddatabase:27017/my-app?authSource=admin
NODE_ENV=production
SKIP_ENV_VALIDATION=true
TSC_COMPILE_ON_ERROR=true
DISABLE_ESLINT=true
```

## Testing After Setup

After setting environment variables, test these endpoints:

1. **Environment Check:**
   ```
   https://your-app.liara.run/api/check-env
   ```

2. **Database Connection:**
   ```
   https://your-app.liara.run/api/test-db
   ```

3. **Authentication Test:**
   ```
   https://your-app.liara.run/api/auth?phone=user&password=pass
   ```

## Expected Results

After successful setup, you should see in Liara logs:

```
✅ MongoDB connected successfully
📍 Database: my-app
🌐 Host: hrddatabase
🚀 Initializing Production Database...
✅ Database connection verified
```

## Troubleshooting

If environment variables still don't work:

1. Check if `liara.json` is being read correctly
2. Try using Liara CLI method
3. Contact Liara support for environment variable setup
4. Check if your app has the correct permissions

The `liara.json` method should work automatically when you push to GitHub!
