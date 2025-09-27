# Deployment Guide for Vercel

This guide will help you deploy your StreamFlix application to Vercel.

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. A GitHub, GitLab, or Bitbucket account
3. Your StreamFlix project pushed to a Git repository

## Deployment Steps

### 1. Prepare Your Repository

Make sure your project is pushed to a Git repository. The following files have been configured for Vercel deployment:

- `vercel.json` - Vercel configuration file
- `.env.production` - Production environment variables template
- `.vercelignore` - Files to ignore during deployment

### 2. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect the project settings

### 3. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

```bash
# Database configuration
DATABASE_URL=your_production_database_url

# JWT Secret (generate a secure random string)
JWT_SECRET=your_secure_jwt_secret

# TMDB API Key (get from https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_api_key

# Lygos API Key
LYGOS_API_KEY=your_lygos_api_key

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# URLs
CLIENT_URL=https://your-project-name.vercel.app
BASE_URL=https://your-project-name.vercel.app
```

### 4. Configure Build Settings

Vercel should automatically detect the correct settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If not automatically detected, set these manually in the project settings.

### 5. Deploy

Click "Deploy" and wait for the build to complete. Vercel will provide you with a deployment URL.

## Post-Deployment Configuration

### Database Setup

1. Set up your PostgreSQL database (you can use services like Supabase, Neon, or Railway)
2. Run database migrations:
   ```bash
   npx drizzle-kit push
   ```

### Domain Configuration (Optional)

1. In your Vercel dashboard, go to your project settings
2. Navigate to the "Domains" section
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**: Make sure all required environment variables are configured in Vercel project settings
2. **Database Connection**: Verify your DATABASE_URL is correct and the database is accessible
3. **Build Failures**: Check the build logs in Vercel for specific error messages

### Checking Logs

1. In your Vercel dashboard, go to your project
2. Click on the "Functions" tab to see serverless function logs
3. Check the "Build & Development" logs for build errors

## Updating Your Deployment

To update your deployed application:

1. Push changes to your Git repository
2. Vercel will automatically trigger a new deployment
3. Alternatively, you can manually trigger a deployment from the Vercel dashboard

## Support

For additional help with deployment:
- Check the main README.md for general project information
- Refer to Vercel's documentation at [vercel.com/docs](https://vercel.com/docs)