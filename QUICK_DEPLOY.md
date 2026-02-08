# 🚀 QUICK DEPLOYMENT GUIDE

## ✅ Step 1: Backend on Render

1. **Go to Render**: https://dashboard.render.com/
2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub: `Kingmoha123/myStudent`
   - **Settings**:
     - Name: `student-management-backend`
     - Region: Oregon (Free)
     - Branch: `main`
     - Root Directory: `backend`
     - Runtime: Node
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Environment Variables** (Add in Environment tab):
   ```
   MONGODB_URI=mongodb+srv://mohan21:123@cluster0.afaipw7.mongodb.net/sms_db_s?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=mohan123
   PORT=10000
   FRONTEND_URL=https://your-app.vercel.app
   ```
   
4. **Deploy** → Wait 5-10 minutes
5. **Copy Backend URL**: `https://student-management-backend.onrender.com`

---

## ✅ Step 2: Frontend on Vercel

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import `Kingmoha123/myStudent`
   - **Settings**:
     - Framework: Next.js
     - Root Directory: `front`
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Environment Variables** (Add before deploying):
   ```
   NEXT_PUBLIC_API_URL=https://student-management-backend.onrender.com/api
   ```
   ⚠️ **Replace with YOUR actual Render backend URL!**

4. **Deploy** → Wait 3-5 minutes
5. **Copy Frontend URL**: `https://your-app.vercel.app`

---

## ✅ Step 3: Update CORS

1. **Go back to Render Dashboard**
2. **Open your backend service**
3. **Environment tab** → Edit `FRONTEND_URL`
4. **Update to**: `https://your-app.vercel.app` (your actual Vercel URL)
5. **Save** → Backend will auto-redeploy

---

## 🧪 Test Your Deployment

### Test Backend:
Visit: `https://your-backend.onrender.com/api/status`

Should see:
```json
{"status":"ok","version":"1.2","time":"..."}
```

### Test Frontend:
1. Visit your Vercel URL
2. Try to login/register
3. Check browser console for errors

---

## 🔧 Common Issues

### ❌ CORS Error
- **Fix**: Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Include `https://` in the URL
- Redeploy backend after changing

### ❌ API Not Found
- **Fix**: Verify `NEXT_PUBLIC_API_URL` in Vercel ends with `/api`
- Example: `https://backend.onrender.com/api` ✅
- Not: `https://backend.onrender.com` ❌

### ❌ Backend Slow
- **Normal**: Render free tier sleeps after inactivity
- First request takes 30-60 seconds
- Subsequent requests are fast

---

## 📝 Your URLs

Fill these in after deployment:

**Backend URL**: `_________________________________`

**Frontend URL**: `_________________________________`

**GitHub Repo**: `https://github.com/Kingmoha123/myStudent`

---

## 🔄 Update Your App

To deploy updates:

```bash
cd c:\Users\pc\Downloads\myStudentWeb
git add .
git commit -m "Your update message"
git push origin main
```

Both Vercel and Render will auto-deploy! 🎉

---

## 📞 Need Help?

- Check deployment logs in Render/Vercel dashboards
- Verify all environment variables are set correctly
- Make sure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
