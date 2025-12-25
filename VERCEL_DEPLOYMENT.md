# Vercel Deployment - Environment Variables Setup

## 🚀 Deploying to Vercel

After pushing to GitHub, you need to configure environment variables in Vercel for Supabase to work.

---

## 📋 Required Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables** and add these:

### 1. `VITE_SUPABASE_URL`
- **Value**: Your Supabase project URL
- **Where to find it**: 
  - Go to https://supabase.com
  - Select your project
  - Go to **Settings** → **API**
  - Copy the **Project URL**
  - Example: `https://abcdefghijklmnop.supabase.co`

### 2. `VITE_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anonymous/public key
- **Where to find it**:
  - Same location as above (Settings → API)
  - Copy the **anon public** key (long string)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## ⚙️ Steps to Add in Vercel

1. **Go to Vercel Dashboard**
   - https://vercel.com

2. **Select Your Project**
   - Click on "GS-CARS-Rental-Software" (or your project name)

3. **Navigate to Settings**
   - Click **Settings** tab

4. **Add Environment Variables**
   - Click **Environment Variables** in the sidebar
   - Click **Add New**
   
5. **Add Each Variable**
   
   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: [Paste your Supabase URL]
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**
   
   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: [Paste your Supabase anon key]
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

6. **Redeploy**
   - Go to **Deployments** tab
   - Click the ⋮ menu on the latest deployment
   - Click **Redeploy**
   - Select "Use existing Build Cache: No"
   - Click **Redeploy**

---

## ✅ Verify It Works

After redeployment:
1. Visit your deployed site
2. Try logging in as admin
3. Try viewing the fleet
4. Try creating a reservation

If everything works, you're done! 🎉

---

## 🔒 Security Notes

- ✅ The `anon` key is safe to expose (it's public)
- ✅ Row Level Security (RLS) policies protect your data
- ✅ Never commit `.env` files to Git
- ✅ Environment variables are encrypted in Vercel

---

## 📝 Local Development

Your local `.env` file should look like this:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

This file is already in `.gitignore` so it won't be pushed to GitHub.

---

## 🆘 Troubleshooting

**Problem**: App can't connect to Supabase
- **Solution**: Double-check the environment variables are correct

**Problem**: Changes not reflecting
- **Solution**: Redeploy without build cache

**Problem**: 404 errors on refresh
- **Solution**: Check that `vercel.json` is correctly configured (it already is!)

---

## 🎯 What's Already Configured

✅ `vercel.json` - SPA routing configuration
✅ Build command - `npm run build`
✅ Output directory - `dist`
✅ All dependencies in `package.json`

You just need to add the environment variables and you're good to go!
