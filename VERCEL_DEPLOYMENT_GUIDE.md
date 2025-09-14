# Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. **Environment Variables Setup**
In your Vercel dashboard, add these environment variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

**For local development:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. **Vercel Configuration**
The project includes a `vercel.json` file with optimized settings:
- Build configuration for Next.js
- Function timeout settings
- Route handling
- Environment variable mapping

### 3. **Common Deployment Issues & Solutions**

#### **Function Timeout Errors (504)**
- ✅ **Fixed**: Added `maxDuration: 30` for functions
- ✅ **Fixed**: Optimized webpack configuration
- ✅ **Fixed**: Reduced bundle size with package imports optimization

#### **Body Not String Errors (502)**
- ✅ **Fixed**: Added SSR safety checks in components
- ✅ **Fixed**: Fixed fullscreen API usage with optional chaining
- ✅ **Fixed**: Added window/document checks

#### **Build Failures**
- ✅ **Fixed**: Updated Next.js config for production
- ✅ **Fixed**: Added standalone output mode
- ✅ **Fixed**: Optimized image loading and caching

#### **Environment Variable Issues**
- ✅ **Fixed**: Created proper env configuration
- ✅ **Fixed**: Added fallback URLs for production

### 4. **Deployment Checklist**

- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel dashboard
- [ ] Ensure backend is deployed and accessible
- [ ] Check that all images are served over HTTPS
- [ ] Verify CORS settings on backend
- [ ] Test the deployment URL

### 5. **Backend Requirements**
Your backend must be:
- Deployed and accessible via HTTPS
- Configured with proper CORS settings
- Serving the web content API endpoints

### 6. **Testing the Deployment**

1. **Check Environment Variables:**
   ```bash
   # In Vercel dashboard, verify:
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```

2. **Test API Connection:**
   ```bash
   curl https://your-backend-domain.com/api/health
   ```

3. **Verify CORS Settings:**
   Your backend should allow requests from your Vercel domain.

### 7. **Troubleshooting**

#### **Still Getting 502/500 Errors?**
1. Check Vercel function logs
2. Verify environment variables are set
3. Ensure backend is running and accessible
4. Check CORS configuration

#### **Images Not Loading?**
1. Verify image URLs are HTTPS
2. Check `next.config.js` image domains
3. Ensure images are properly uploaded

#### **API Calls Failing?**
1. Check `NEXT_PUBLIC_API_URL` is correct
2. Verify backend CORS settings
3. Check network tab for specific errors

### 8. **Performance Optimizations Applied**

- ✅ Standalone output mode
- ✅ Image optimization
- ✅ Bundle size reduction
- ✅ CSS optimization
- ✅ Package import optimization
- ✅ Webpack fallback configuration

### 9. **Monitoring**

After deployment, monitor:
- Function execution times
- Error rates
- API response times
- Build success rates

## 🎯 **Expected Results**

After following this guide, you should have:
- ✅ Successful Vercel deployment
- ✅ Working frontend with backend integration
- ✅ Interactive web workbook viewer
- ✅ Optimized performance
- ✅ Proper error handling

## 📞 **Need Help?**

If you're still experiencing issues:
1. Check Vercel function logs
2. Verify all environment variables
3. Test backend connectivity
4. Review CORS configuration
