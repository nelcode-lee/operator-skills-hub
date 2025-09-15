# Current Technology Stack

## 🏗️ **Production Architecture**

### **Frontend & Backend: Vercel**
- **Frontend**: Next.js deployed on Vercel
- **Backend**: FastAPI deployed on Vercel (serverless functions)
- **Domain**: `https://operator-skills-hub.vercel.app`

### **Database: Neon PostgreSQL**
- **Provider**: Neon (serverless PostgreSQL)
- **Connection**: Via `DATABASE_URL` environment variable
- **Features**: Automatic scaling, connection pooling, branching

### **File Storage: AWS S3**
- **Provider**: Amazon S3
- **Configuration**: Via AWS environment variables
- **Use Cases**: Course materials, images, documents

## 🔧 **Environment Variables**

### **Required for Production:**
```bash
# Database
DATABASE_URL=postgresql://neondb_owner:...@ep-...-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Authentication
JWT_SECRET=your-secure-jwt-secret-key

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=eu-west-2
S3_BUCKET_NAME=your-s3-bucket-name

# OpenAI (Optional)
OPENAI_API_KEY=your-openai-api-key

# Frontend API URL
NEXT_PUBLIC_API_URL=https://operator-skills-hub.vercel.app
```

## 🚀 **Deployment Process**

### **Automatic Deployment:**
1. **Push to GitHub** → Vercel automatically deploys
2. **Database seeding** → Runs automatically on startup if empty
3. **Environment variables** → Set in Vercel dashboard

### **Manual Database Seeding:**
```bash
# Check seeding status
GET https://operator-skills-hub.vercel.app/api/seed-status

# Trigger manual seeding
POST https://operator-skills-hub.vercel.app/api/seed-database
```

## 📁 **Project Structure**
```
OperatorSkillsHub/
├── frontend/                 # Next.js frontend
│   ├── src/app/             # App router pages
│   ├── src/components/      # React components
│   ├── src/lib/            # Utilities and services
│   └── vercel.json         # Vercel configuration
├── backend/                 # FastAPI backend
│   ├── app/                # Main application code
│   ├── seed_demo_data.py   # Database seeding script
│   └── requirements.txt    # Python dependencies
└── CURRENT_STACK.md        # This file
```

## 🔄 **Development Workflow**

### **Local Development:**
```bash
# Start backend
cd backend && python -m uvicorn app.main:app --reload --port 8000

# Start frontend
cd frontend && npm run dev
```

### **Production Deployment:**
```bash
# Push changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically deploys
```

## 🚫 **Deprecated Platforms**

### **❌ Railway** - No longer used
- Remove any Railway references
- Update CORS settings
- Clean up Railway-specific configs

### **❌ Render** - No longer used  
- Remove Render environment variables
- Update API URLs
- Clean up Render-specific configs

## ✅ **Current Stack Benefits**

1. **Unified Platform**: Frontend and backend on Vercel
2. **Serverless**: Automatic scaling and cost optimization
3. **Modern Database**: Neon PostgreSQL with branching
4. **Reliable Storage**: AWS S3 for file management
5. **Easy Deployment**: Git-based continuous deployment
6. **Built-in Monitoring**: Vercel analytics and logs

## 🔍 **Monitoring & Debugging**

### **Vercel Dashboard:**
- Function logs and metrics
- Deployment history
- Performance analytics
- Error tracking

### **Health Checks:**
- Frontend: `https://operator-skills-hub.vercel.app`
- Backend: `https://operator-skills-hub.vercel.app/api/health`
- Database: `https://operator-skills-hub.vercel.app/api/seed-status`

## 📞 **Support**

For deployment issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test database connectivity
4. Review CORS configuration
5. Check Neon database status
