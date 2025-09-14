# Vercel 404 Error Fix

## 🔧 **Quick Fix for 404 Error**

The 404 error you're experiencing is likely due to Vercel not properly detecting the Next.js app in the `frontend/` subdirectory.

## ✅ **Changes Made:**

### 1. **Updated `vercel.json`**
- Simplified configuration for better Vercel detection
- Proper routing for frontend subdirectory
- Removed complex build configurations that might cause issues

### 2. **Added Root `package.json`**
- Created workspace configuration
- Helps Vercel understand the project structure
- Provides proper build commands

### 3. **Fixed Next.js Config**
- Commented out `output: 'standalone'` which can cause issues with Vercel
- Kept other optimizations for performance

## 🚀 **Deployment Steps:**

### **Option 1: Automatic Detection (Recommended)**
1. Go to your Vercel dashboard
2. Delete the current deployment
3. Re-import your GitHub repository
4. Vercel should now automatically detect the Next.js app in the `frontend/` folder

### **Option 2: Manual Configuration**
1. In Vercel dashboard, go to your project settings
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `.next`
5. Redeploy

### **Option 3: Use Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel --prod

# Follow prompts:
# - Set root directory to "frontend"
# - Confirm build settings
```

## 🔍 **Environment Variables**
Make sure to set in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## 📋 **Verification Checklist**
- [ ] Root directory is set to `frontend`
- [ ] Build command is `npm run build`
- [ ] Output directory is `.next`
- [ ] Environment variables are set
- [ ] No `output: 'standalone'` in next.config.js

## 🎯 **Expected Result**
After applying these fixes, your Vercel deployment should:
- ✅ Build successfully without 404 errors
- ✅ Serve the Next.js app correctly
- ✅ Display the homepage and all routes
- ✅ Show the interactive web workbook viewer

## 🆘 **Still Getting 404?**
1. Check Vercel function logs
2. Verify the root directory setting
3. Ensure all files are committed and pushed
4. Try a fresh deployment from scratch
