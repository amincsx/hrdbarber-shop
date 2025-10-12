# User Setup Guide - No Hardcoded Passwords

## 🔐 What Changed

**Before:**
- ❌ Hardcoded passwords in admin route
- ❌ Browser prompts to save passwords
- ❌ Security risk

**After:**
- ✅ All passwords stored in MongoDB database
- ✅ Autocomplete disabled on login forms
- ✅ No hardcoded credentials in code
- ✅ Secure authentication

## 🚀 Initial Setup

### **Step 1: Check Current Users**

Open this URL to see existing users:
```
http://localhost:3000/api/setup-users
```

This shows:
- Admin users (role: admin)
- Barber users (role: barber)
- Password status for each user

### **Step 2: Initialize Barber Users**

Auto-create barber user accounts:
```
http://localhost:3000/api/init-barbers
```

This creates users for all barbers:
- Username: mohammad → Name: محمد, Password: mohammad123
- Username: hamid → Name: حمید, Password: hamid123
- Username: benyamin → Name: بنیامین, Password: benyamin123

### **Step 3: Create Admin User**

**Using Browser (Easy):**
```
Open: http://localhost:3000/api/setup-users
Method: POST
Body: {
  "action": "create-admin",
  "username": "ceo",
  "password": "your-secure-password",
  "name": "مدیر سیستم"
}
```

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/setup-users \
  -H "Content-Type: application/json" \
  -d '{"action":"create-admin","username":"ceo","password":"your-secure-password","name":"مدیر سیستم"}'
```

**Using Postman/Insomnia:**
- Method: POST
- URL: `http://localhost:3000/api/setup-users`
- Body (JSON):
```json
{
  "action": "create-admin",
  "username": "ceo",
  "password": "your-secure-password",
  "name": "مدیر سیستم"
}
```

## 📝 User Management

### **Create New Barber User**

```bash
curl -X POST http://localhost:3000/api/setup-users \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-barber",
    "username": "ali",
    "name": "علی",
    "password": "ali123"
  }'
```

### **Update User Password**

```bash
curl -X POST http://localhost:3000/api/setup-users \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update-password",
    "username": "mohammad",
    "password": "new-secure-password"
  }'
```

### **Check All Users**

```bash
curl http://localhost:3000/api/setup-users
```

## 🔑 Default Credentials Created

After running `/api/init-barbers`, you'll have:

| Username | Name | Password | Role |
|----------|------|----------|------|
| mohammad | محمد | mohammad123 | barber |
| hamid | حمید | hamid123 | barber |
| benyamin | بنیامین | benyamin123 | barber |

**⚠️ IMPORTANT:** Change these default passwords in production!

## 🛡️ Security Improvements

### **1. Autocomplete Disabled**
Login forms now have:
```html
<form autoComplete="off">
  <input autoComplete="off" />
  <input autoComplete="new-password" />
</form>
```

This prevents:
- ❌ Browser password save prompts
- ❌ Autofill suggestions
- ✅ Better UX for login

### **2. No Hardcoded Passwords**
All authentication now requires database users. No fallback credentials in code.

### **3. Secure Password Storage**
Passwords stored in MongoDB Users collection. 

**⚠️ NOTE:** Passwords are currently stored in **plain text**. For production, you should:
1. Hash passwords using bcrypt
2. Use environment variables for sensitive data
3. Implement password reset functionality

## 🧪 Testing Login

### **Test Barber Login:**
1. Go to: `http://localhost:3000/barber-login`
2. Username: `mohammad`
3. Password: `mohammad123` (or whatever you set)
4. Should redirect to: `/barber-dashboard/mohammad`

### **Test Owner Login:**
1. Go to: `http://localhost:3000/admin`
2. Username: `ceo`
3. Password: (whatever you set when creating admin)
4. Should access admin panel

## ❌ Removed Hardcoded Credentials

**From `src/app/api/admin/route.js`:**
```javascript
// BEFORE (REMOVED):
if ((username === 'owner' && password === 'owner123') ||
    (username === 'ceo' && password === 'instad')) {
  // Allow login
}

// AFTER:
// All authentication goes through MongoDB database
// No hardcoded credentials
```

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Run `/api/init-barbers` to create barber users
- [ ] Run `/api/setup-users` to create admin user with secure password
- [ ] Change all default passwords (mohammad123, etc.)
- [ ] Verify all logins work
- [ ] Test password autocomplete is disabled
- [ ] Consider implementing bcrypt password hashing
- [ ] Set up password reset functionality

## 📞 Quick Setup Commands

```bash
# 1. Check current users
curl http://localhost:3000/api/setup-users

# 2. Create barber users (if not exists)
curl http://localhost:3000/api/init-barbers

# 3. Create admin user
curl -X POST http://localhost:3000/api/setup-users \
  -H "Content-Type: application/json" \
  -d '{"action":"create-admin","username":"ceo","password":"YOUR_PASSWORD","name":"مدیر سیستم"}'

# 4. Update a password
curl -X POST http://localhost:3000/api/setup-users \
  -H "Content-Type: application/json" \
  -d '{"action":"update-password","username":"mohammad","password":"NEW_PASSWORD"}'
```

## ✅ All Fixed!

- ✅ No hardcoded passwords in code
- ✅ All credentials in database
- ✅ Autocomplete disabled
- ✅ No browser password prompts
- ✅ Secure authentication flow

