# Deployment Guide

## Frontend Deployment (Next.js on Vercel)

### 1. Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub account

### 2. Connect Repository
- Import your GitHub repository
- Vercel will auto-detect Next.js

### 3. Set Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

### 4. Deploy
- Vercel automatically deploys on push to main branch
- Deploy status visible in dashboard

## Backend Deployment (Express on Railway or Render)

### Option A: Deploy to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Select "Deploy from GitHub"
   - Connect your repository

3. **Configure Environment Variables**
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: Strong random secret
   - `PORT`: 8000 (Railway uses dynamic ports)
   - `NODE_ENV`: production

4. **Deploy**
   - Railway automatically detects Node.js
   - Deploys on push to main

### Option B: Deploy to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Connect GitHub repository
   - Set Start Command: `cd backend && npm start`

3. **Configure Environment Variables**
   - Same as Railway above

4. **Deploy**
   - Render automatically builds and deploys

## MongoDB Deployment (Atlas)

### 1. Create MongoDB Account
- Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- Sign up with email

### 2. Create Cluster
- Select "Shared" (free tier)
- Choose region closest to your users
- Create cluster

### 3. Create Database User
- Go to Database Access
- Create user with strong password
- Add IP whitelist (or 0.0.0.0 for all)

### 4. Get Connection String
- Go to Clusters → Connect
- Select "Connect your application"
- Copy connection string

### 5. Update Backend
Replace in `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sms?retryWrites=true&w=majority
```

## Environment Variables Checklist

### Frontend (.env.local on Vercel)
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL

### Backend (.env on Railway/Render)
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Strong random secret (min 32 chars)
- [ ] `PORT` - Should be dynamic (8000 for Render, auto for Railway)
- [ ] `NODE_ENV` - Set to "production"

## Post-Deployment

### 1. Test API Endpoints
```bash
curl https://your-backend-api.com/api/auth/login -X POST
```

### 2. Test Frontend
- Open frontend URL
- Try login/registration
- Test each module

### 3. Monitor
- Check Vercel Analytics
- Monitor Railway/Render logs
- Set up error tracking

## Scaling Considerations

- **Database**: Use MongoDB Atlas for better performance
- **Images**: Consider using Cloudinary or similar for file uploads
- **Caching**: Implement Redis for session caching
- **Load Balancing**: Railway/Render handle this automatically

## Troubleshooting Deployment

### 504 Gateway Timeout
- Backend might be sleeping (Railway free tier)
- Upgrade to paid plan for persistent service

### API Connection Failed
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend environment variables
- Check CORS configuration in backend

### Database Connection Error
- Verify MongoDB URI is correct
- Check IP whitelist includes deployment server
- Ensure MongoDB user has correct permissions

## Rollback

### Vercel
- Go to Deployments
- Click "Promote" on previous deployment

### Railway/Render
- Redeploy from previous commit
- Or use deployment history feature
