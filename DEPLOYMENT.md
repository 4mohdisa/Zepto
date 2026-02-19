# Deployment Guide

## Deploy to Vercel (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/new
   - Import your GitHub repository: `4mohdisa/Zepto`

2. **Configure Environment Variables**
   Add these environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://zepto-yourusername.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /path/to/zepto
vercel

# Follow prompts:
# ? Set up and deploy "~/Zepto"? [Y/n] y
# ? Which scope do you want to deploy to? [your-username]
# ? Link to existing project? [y/N] n
# ? What's your project name? [zepto]

# Production deployment
vercel --prod
```

---

## Deploy to Netlify

### Option 1: Deploy via Netlify Dashboard

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com/start
   - Connect to GitHub and select `4mohdisa/Zepto`

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18` or `20`

3. **Environment Variables**
   Add the same environment variables as above in Site Settings → Environment Variables

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize and deploy
netlify init
netlify deploy --build

# Production deploy
netlify deploy --prod --build
```

---

## Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ Yes | Clerk secret key |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Admin features | Supabase service role key |

---

## Post-Deployment Checklist

- [ ] App loads without errors
- [ ] Sign in works
- [ ] Sign up works
- [ ] Dashboard loads
- [ ] Can add transactions
- [ ] Charts display correctly
- [ ] Account balances work
- [ ] Mobile responsive

---

## Troubleshooting

### Build Failures
```
Error: Build failed
```
- Check environment variables are set
- Check Node.js version (18+ required)

### Runtime Errors
```
Error: Cannot find module
```
- Run `npm ci` instead of `npm install`
- Check all dependencies are in package.json

### Database Connection Issues
- Verify Supabase URL is correct
- Check RLS policies allow your deployment domain
- Ensure Clerk JWT template is configured

---

## Production Checklist

Before going live:
- [ ] Use production Clerk instance (not development)
- [ ] Use production Supabase project
- [ ] Set up custom domain (optional)
- [ ] Enable analytics
- [ ] Test all critical paths
- [ ] Set up monitoring

---

## Update Deployment

After pushing new code to GitHub:

**Vercel:** Auto-deploys on every push to main  
**Netlify:** Auto-deploys on every push to main  
**Manual:** Run `vercel --prod` or `netlify deploy --prod`

---

## Quick Deploy Commands

```bash
# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --build

# Or just push to GitHub (auto-deploys)
git push origin main
```

---

**Current Repository:** https://github.com/4mohdisa/Zepto
