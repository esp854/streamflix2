# Railway Deployment Guide

This guide will help you deploy your StreamFlix application to Railway.

## Prerequisites

1. A Railway account (free at [railway.app](https://railway.app))
2. A GitHub, GitLab, or Bitbucket account
3. Your StreamFlix project pushed to a Git repository

## Deployment Steps

### 1. Prepare Your Repository

Make sure your project is pushed to a Git repository. The following files have been configured for Railway deployment:

- `railway.json` - Railway configuration file
- `Dockerfile` - Docker configuration for containerized deployment
- `.dockerignore` - Files to exclude from Docker build
- `.env` - Environment variables (already configured)

### 2. Import Project to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub" (or your Git provider)
4. Choose your StreamFlix repository
5. Railway will automatically detect the project settings

### 3. Configure Environment Variables

Railway will automatically detect some environment variables, but you may need to add or modify the following in the Railway dashboard:

```bash
# Database configuration (using your provided Railway PostgreSQL database)
DATABASE_URL=postgresql://postgres:GriCZZNCRTLbKetAZrDcMVsBZAhIgILU@maglev.proxy.rlwy.net:52057/railway

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

# URLs (Railway will provide these automatically)
CLIENT_URL=https://your-project-production.up.railway.app
BASE_URL=https://your-project-production.up.railway.app

# Port (Railway will set this automatically)
PORT=3000
```

### 4. Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway will automatically set the DATABASE_URL environment variable

### 5. Configure Build Settings

Railway will use the Dockerfile for building the application:
- **Builder**: Dockerfile
- **Start Command**: `npm run start` (configured in railway.json)

### 6. Deploy

Railway will automatically start the deployment. You can monitor the progress in the deployment logs.

## Post-Deployment Configuration

### Database Setup

1. After the first deployment, run database migrations:
   ```bash
   railway run npm run db:push
   ```

### Domain Configuration (Optional)

1. In your Railway dashboard, go to your project
2. Navigate to the "Settings" tab
3. Under "Domains", add your custom domain
4. Follow the DNS configuration instructions

## Environment Variables

Railway provides some environment variables automatically:
- `PORT` - The port your application should listen on
- `DATABASE_URL` - When using Railway PostgreSQL
- `NODE_ENV` - Set to "production" automatically

The Docker container will use these environment variables as configured in the Dockerfile and application code.

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**: Make sure all required environment variables are configured in Railway project settings
2. **Database Connection**: Verify your DATABASE_URL is correct and the database is accessible
3. **Build Failures**: Check the build logs in Railway for specific error messages
4. **Port Issues**: Railway requires applications to listen on the port specified by the `PORT` environment variable

### Checking Logs

1. In your Railway dashboard, go to your project
2. Click on the deployment to see logs
3. Check both build logs and application logs

## Updating Your Deployment

To update your deployed application:

1. Push changes to your Git repository
2. Railway will automatically trigger a new deployment
3. Alternatively, you can manually trigger a deployment from the Railway dashboard

## CLI Deployment (Alternative)

You can also deploy using the Railway CLI:

1. Install the Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

## Support

For additional help with deployment:
- Check the main README.md for general project information
- Refer to Railway's documentation at [docs.railway.app](https://docs.railway.app)