# GitHub Pages Deployment Guide

## Prerequisites
✅ Login page now shows "Welcome" instead of "Admin Login"
✅ Sign out redirects to home page
✅ Input fields have consistent padding (boxSizing: border-box)
✅ Sign In button expands full width

## Deployment Steps

### 1. Install gh-pages Package
```bash
cd play-it-pro-platform
npm install
```

### 2. Update GitHub Repository Settings
1. Go to your GitHub repository: `https://github.com/yourusername/drumlessonsbymark`
2. Go to **Settings** → **Pages**
3. Under "Source", select **"Deploy from a branch"**
4. Select branch: **gh-pages**
5. Select folder: **/ (root)**
6. Click **Save**

### 3. Update package.json Homepage
Replace `yourusername` in `package.json` line 6 with your actual GitHub username:
```json
"homepage": "https://YOURUSERNAME.github.io/drumlessonsbymark"
```

### 4. Deploy to GitHub Pages
```bash
npm run deploy
```

This will:
- Build your React app
- Create a `gh-pages` branch (if it doesn't exist)
- Push the built files to the `gh-pages` branch
- Deploy to GitHub Pages

### 5. Access Your Live Site
After deployment completes (1-2 minutes), visit:
```
https://YOURUSERNAME.github.io/drumlessonsbymark
```

## Important Notes

### Custom Domain (Optional)
If you have a custom domain (like drumlessonsbymark.com):

1. Update `vite.config.ts` - change base to:
   ```typescript
   base: '/',
   ```

2. Update `package.json` - change homepage to:
   ```json
   "homepage": "https://drumlessonsbymark.com"
   ```

3. Add a `CNAME` file to the `public` folder with your domain:
   ```
   drumlessonsbymark.com
   ```

4. Configure your domain's DNS settings to point to GitHub Pages

### Environment Variables
For production, you may want to create a `.env.production` file with:
```
VITE_RECAPTCHA_SITE_KEY=6LfpRfgrAAAAADKnlAAQ696lz8DB93jBEsx_FHXD
```

### Supabase RLS Policies
Make sure your Supabase domain allows:
- Your GitHub Pages URL
- Your custom domain (if applicable)

Add these to your reCAPTCHA allowed domains in Google Console.

## Troubleshooting

### Blank Page After Deployment
- Check browser console for errors
- Verify the `base` path in `vite.config.ts` matches your repository name
- Make sure GitHub Pages is enabled in repository settings

### 404 Errors on Page Refresh
Add a `404.html` file that redirects to `index.html` (GitHub Pages SPA workaround)

### Assets Not Loading
- Verify all asset paths use relative paths or start with `/`
- Check that assets are in the `public` folder

## Quick Deploy Commands
```bash
# Deploy to GitHub Pages
npm run deploy

# Build only (without deploying)
npm run build

# Preview build locally
npm run preview
```

## What's Configured
- ✅ Vite build for production
- ✅ GitHub Pages base path
- ✅ Deploy scripts in package.json
- ✅ All assets moved to public folder
- ✅ React Router configured for SPA
- ✅ Supabase integration
- ✅ reCAPTCHA configured
- ✅ Admin dashboard
- ✅ Contact form with database storage
