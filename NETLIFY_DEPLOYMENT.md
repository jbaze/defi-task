# Netlify Deployment Guide

This guide provides step-by-step instructions to deploy the DeFi Guard application (with ETH Wallet) to Netlify.

## Table of Contents
- [Quick Start](#quick-start)
- [Method 1: Deploy via Netlify UI (Recommended)](#method-1-deploy-via-netlify-ui-recommended)
- [Method 2: Deploy via Netlify CLI](#method-2-deploy-via-netlify-cli)
- [Method 3: Deploy via Git (Continuous Deployment)](#method-3-deploy-via-git-continuous-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Backend Deployment (Optional)](#backend-deployment-optional)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

This project consists of:
- **Frontend**: React SPA (Single Page Application) with React Router
- **Backend**: Node.js/Express server (currently optional, mostly placeholder)
- **Wallet**: Client-side Web3.js integration (no backend required)

**Note**: The current application, including the Wallet functionality, works entirely client-side and doesn't require the backend server. The backend can be deployed separately if needed for future features.

---

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- A Netlify account (free tier works great)
- Git (for Method 3)

---

## Method 1: Deploy via Netlify UI (Recommended)

This is the easiest method for first-time deployments.

### Step 1: Build the Project Locally

```bash
# Navigate to project directory
cd /path/to/defi-task

# Install dependencies (if not already done)
npm install

# Create production build
npm run build
```

This creates a `build` folder with optimized production files.

### Step 2: Deploy to Netlify

1. **Log in to Netlify**
   - Go to [https://app.netlify.com](https://app.netlify.com)
   - Sign up or log in with GitHub, GitLab, Bitbucket, or email

2. **Deploy Your Site**
   - Click **"Add new site"** → **"Deploy manually"**
   - Drag and drop the `build` folder into the upload area
   - Wait for deployment to complete (usually 30-60 seconds)

3. **Your Site is Live!**
   - Netlify will provide a random URL like `https://random-name-123456.netlify.app`
   - You can customize this later in Site Settings

### Step 3: Configure Site Settings (Optional but Recommended)

1. **Change Site Name**
   - Go to **Site settings** → **General** → **Site details**
   - Click **"Change site name"**
   - Enter a custom name (e.g., `my-defi-wallet`)
   - Your site will be available at `https://my-defi-wallet.netlify.app`

2. **Add Custom Domain** (Optional)
   - Go to **Domain settings**
   - Click **"Add custom domain"**
   - Follow the DNS configuration instructions

---

## Method 2: Deploy via Netlify CLI

Perfect for developers who prefer command-line tools.

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Authenticate

```bash
netlify login
```

This opens your browser to authenticate with Netlify.

### Step 3: Initialize and Deploy

```bash
# Navigate to project directory
cd /path/to/defi-task

# Build the project
npm run build

# Initialize Netlify (first time only)
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Choose your team
# - Enter a site name (or leave blank for random)
# - Build command: npm run build
# - Publish directory: build

# Deploy to production
netlify deploy --prod
```

### Quick Deploy (After Initial Setup)

```bash
# Build and deploy in one command
npm run build && netlify deploy --prod
```

---

## Method 3: Deploy via Git (Continuous Deployment)

Best for ongoing development with automatic deployments.

### Step 1: Push Code to Git Repository

```bash
# If not already a git repository
git init
git add .
git commit -m "Initial commit"

# Push to GitHub, GitLab, or Bitbucket
git remote add origin https://github.com/yourusername/defi-task.git
git push -u origin main
```

### Step 2: Connect Repository to Netlify

1. **Log in to Netlify**
   - Go to [https://app.netlify.com](https://app.netlify.com)

2. **Import Project**
   - Click **"Add new site"** → **"Import an existing project"**
   - Choose your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your repository (`defi-task`)

3. **Configure Build Settings**
   - **Branch to deploy**: `main` (or your default branch)
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Base directory**: (leave empty)

4. **Deploy Site**
   - Click **"Deploy site"**
   - Netlify will automatically build and deploy

### Step 3: Automatic Deployments

From now on, every push to your main branch will trigger automatic deployment!

```bash
# Make changes
git add .
git commit -m "Update wallet design"
git push origin main

# Netlify automatically rebuilds and deploys
```

---

## Post-Deployment Configuration

### Configure Redirects for React Router

Create a `_redirects` file in the `public` folder:

```bash
# Create the file
cat > public/_redirects << 'EOF'
/*    /index.html   200
EOF
```

Or you can use `netlify.toml` (already created in this guide):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Why?** This ensures React Router works correctly when users navigate directly to routes like `/wallet` or `/services`.

### Environment Variables (If Needed)

If you add any environment variables in the future:

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Enter key-value pairs (e.g., `REACT_APP_API_URL`)

**Note**: Remember to prefix React environment variables with `REACT_APP_`

---

## Backend Deployment (Optional)

The current application doesn't require the backend server. However, if you want to deploy it for future features:

### Option 1: Deploy Backend to Render/Railway/Heroku

1. **Separate the Backend**
   - Create a separate repository for the `server` folder
   - Add a `package.json` in the server directory

2. **Deploy to a Node.js Hosting Service**
   - **Render**: [https://render.com](https://render.com) (Recommended, free tier)
   - **Railway**: [https://railway.app](https://railway.app)
   - **Heroku**: [https://heroku.com](https://heroku.com)

3. **Update Frontend to Connect**
   - Add backend URL to environment variables
   - Update Socket.io connection in frontend

### Option 2: Use Netlify Functions (Advanced)

Convert Express routes to Netlify serverless functions:
- Place functions in `netlify/functions/` directory
- Rewrite Socket.io logic (Socket.io doesn't work with serverless)

---

## Troubleshooting

### Issue: Blank Page After Deployment

**Solution**:
- Ensure `_redirects` file exists in `public` folder
- Or add redirects to `netlify.toml`
- Check browser console for errors

### Issue: Routes Return 404

**Solution**:
- This is the same as above - you need redirects configured
- Make sure `_redirects` or `netlify.toml` is in place

### Issue: Build Fails on Netlify

**Solution**:
- Check Node.js version matches your local environment
- Go to Site Settings → Build & Deploy → Environment
- Set `NODE_VERSION` environment variable (e.g., `18`)

### Issue: Web3.js CORS Errors

**Solution**:
- This is expected - Web3.js loads from CDN client-side
- The wallet will still work, but users may see console warnings
- Users can ignore these or run locally with a local server

### Issue: Wallet Features Don't Work

**Checklist**:
- ✅ Web3.js CDN is loading (check browser console)
- ✅ User is on a supported browser (Chrome, Firefox, Edge)
- ✅ User has internet connection for RPC endpoints
- ✅ User is trying to use Sepolia testnet (not mainnet)

---

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Create React App Deployment](https://create-react-app.dev/docs/deployment/)
- [React Router and Netlify](https://docs.netlify.com/routing/redirects/rewrites-proxies/)

---

## Quick Reference Commands

```bash
# Local development
npm install          # Install dependencies
npm start           # Start dev server (frontend + backend)
npm run start-front # Start frontend only
npm run build       # Create production build

# Netlify CLI
netlify login       # Authenticate
netlify init        # Initialize site
netlify deploy      # Deploy to draft URL
netlify deploy --prod # Deploy to production
netlify open        # Open site in browser

# Git deployment
git add .
git commit -m "Update"
git push origin main # Triggers auto-deployment
```

---

## Success Checklist

After deployment, verify:

- [ ] Home page loads correctly
- [ ] Navigation menu works
- [ ] All pages are accessible (Services, About, Features, Team, Blog, Contact, Wallet)
- [ ] Wallet page loads
- [ ] Web3.js library loads (check browser console)
- [ ] Can create/import wallet on Wallet page
- [ ] Styling matches local development
- [ ] Mobile responsive design works

---

## Support

If you encounter any issues:
1. Check the Netlify build logs
2. Review browser console for errors
3. Test the production build locally: `npm run build && npx serve -s build`

Good luck with your deployment! 🚀
