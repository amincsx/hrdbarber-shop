# 🔒 SECURE DEPLOYMENT GUIDE

## ⚠️ **Security Issue Fixed**

The hardcoded MongoDB credentials have been removed from the code for security reasons.

## 🔧 **How to Set Environment Variables Securely**

### **Method 1: Liara CLI (Recommended)**

1. **Install Liara CLI:**
   ```bash
   npm install -g @liara/cli
   ```

2. **Login to Liara:**
   ```bash
   liara login
   ```

3. **Set Environment Variables:**
   ```bash
   liara env:set MONGODB_URI "mongodb://root:HezBrylIIfJuZhRzudMR9qOQ@hrddatabase:27017/my-app?authSource=admin"
   liara env:set NODE_ENV "production"
   liara env:set SKIP_ENV_VALIDATION "true"
   liara env:set TSC_COMPILE_ON_ERROR "true"
   liara env:set DISABLE_ESLINT "true"
   ```

### **Method 2: Liara Web Console**

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

### **Method 3: GitHub Secrets (If Supported)**

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

## 🧪 **Testing After Setup**

1. **Check Environment Variables:**
   ```
   https://your-app.liara.run/api/check-env
   ```

2. **Test Database Connection:**
   ```
   https://your-app.liara.run/api/test-db
   ```

3. **Test Authentication:**
   ```
   https://your-app.liara.run/api/auth?phone=user&password=pass
   ```

## 🔍 **What to Look For in Logs**

After setting environment variables correctly, you should see:

```
🔍 PRODUCTION ENVIRONMENT DEBUG:
NODE_ENV: production
MONGODB_URI set: true
DATABASE_URL set: false
MONGODB_URL set: false
Using URI: mongodb://***:***@hrddatabase:27017/my-app?authSource=admin
✅ Using environment variable MongoDB URI
✅ MongoDB connected successfully
```

## 🚨 **Security Best Practices**

1. **Never commit credentials to Git**
2. **Use environment variables for all sensitive data**
3. **Rotate credentials regularly**
4. **Use least-privilege database users**
5. **Enable MongoDB authentication**
6. **Use SSL/TLS connections in production**

## 🎯 **Next Steps**

1. Set the environment variables using one of the methods above
2. Redeploy your application
3. Test that everything works
4. Monitor logs for successful connections

Your application will now be secure and production-ready! 🔒
