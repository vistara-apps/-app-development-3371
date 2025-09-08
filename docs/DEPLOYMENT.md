# EcoStyle Match Deployment Guide

This guide covers deploying EcoStyle Match to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Vercel Deployment](#vercel-deployment)
- [Supabase Setup](#supabase-setup)
- [Domain Configuration](#domain-configuration)
- [Monitoring & Analytics](#monitoring--analytics)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub repository with the latest code
- [ ] Vercel account (recommended) or alternative hosting
- [ ] Supabase account for database
- [ ] OpenAI API key (or OpenRouter account)
- [ ] Neynar API key for Farcaster integration
- [ ] Domain name (optional but recommended)

## Environment Setup

### Required Environment Variables

Create these environment variables in your deployment platform:

```env
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Farcaster/Neynar Configuration
VITE_NEYNAR_API_KEY=your_neynar_api_key

# WalletConnect Project ID (pre-configured)
VITE_WALLETCONNECT_PROJECT_ID=9f4bd472c01ba49282b42e5e1874c2af

# Payment Configuration
VITE_PAYMENT_API_URL=https://payments.vistara.dev

# App Configuration
VITE_APP_NAME=EcoStyle Match
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

### Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

**Alternative: OpenRouter**
1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account
3. Generate an API key
4. Use `https://openrouter.ai/api/v1` as base URL

#### Supabase Setup
1. Visit [Supabase](https://supabase.com/)
2. Create a new project
3. Copy the Project URL and Anon Key from Settings > API
4. Run the database setup (see [Supabase Setup](#supabase-setup))

#### Neynar API Key
1. Visit [Neynar](https://neynar.com/)
2. Create a developer account
3. Generate an API key for Farcaster integration

## Vercel Deployment

### Automatic Deployment (Recommended)

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Complete PRD implementation"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit [Vercel](https://vercel.com/)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Project Settings > Environment Variables
   - Add all required environment variables from above
   - Redeploy the project

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_OPENAI_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_NEYNAR_API_KEY

# Redeploy with new environment variables
vercel --prod
```

### GitHub Actions (Automated)

The repository includes GitHub Actions for automatic deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm install

    - name: Build application
      run: npm run build
      env:
        NODE_OPTIONS: --max-old-space-size=4096
        
    - name: Deploy to Vercel (Production)
      if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-args: '--prod'
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Required GitHub Secrets:**
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Supabase Setup

### Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  style_preferences JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  eco_impact_summary TEXT,
  style_match TEXT,
  estimated_price TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount TEXT NOT NULL,
  payment_method TEXT DEFAULT 'wallet',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Row Level Security Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own recommendations" ON recommendations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

### Authentication Setup

1. **Enable Authentication**
   - Go to Authentication > Settings
   - Enable "Enable email confirmations"
   - Configure redirect URLs

2. **Configure Providers**
   - Enable desired auth providers (Email, Google, etc.)
   - Configure OAuth settings if needed

## Domain Configuration

### Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **SSL Certificate**
   - Vercel automatically provides SSL certificates
   - Ensure HTTPS redirect is enabled

3. **DNS Configuration**
   ```
   Type: CNAME
   Name: www (or @)
   Value: your-project.vercel.app
   ```

## Monitoring & Analytics

### Error Monitoring

**Sentry Integration (Recommended)**
```bash
npm install @sentry/react @sentry/tracing
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.VITE_APP_ENVIRONMENT,
  tracesSampleRate: 1.0,
});
```

### Performance Monitoring

**Web Vitals**
```javascript
// src/utils/analytics.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Business Analytics

**PostHog Integration**
```bash
npm install posthog-js
```

```javascript
// src/services/analytics.js
import posthog from 'posthog-js';

posthog.init('YOUR_POSTHOG_KEY', {
  api_host: 'https://app.posthog.com'
});

export const trackEvent = (event, properties) => {
  posthog.capture(event, properties);
};
```

## Security Considerations

### Environment Variables
- Never commit API keys to version control
- Use different keys for development/production
- Rotate keys regularly

### CORS Configuration
```javascript
// Supabase CORS settings
const corsOrigins = [
  'https://your-domain.com',
  'https://www.your-domain.com',
  'https://your-project.vercel.app'
];
```

### Content Security Policy
```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               connect-src 'self' https://api.openai.com https://openrouter.ai https://api.neynar.com https://*.supabase.co;">
```

## Performance Optimization

### Build Optimization
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
          ui: ['lucide-react']
        }
      }
    }
  }
});
```

### Caching Strategy
```javascript
// Service worker for caching
self.addEventListener('fetch', event => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open('images').then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

## Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

**Environment Variable Issues**
```bash
# Verify environment variables are set
vercel env ls

# Test locally with production env
vercel env pull .env.local
npm run dev
```

**Database Connection Issues**
- Verify Supabase URL and keys
- Check Row Level Security policies
- Ensure tables exist and have correct permissions

**API Rate Limits**
- Monitor OpenAI usage in dashboard
- Implement request caching
- Add retry logic with exponential backoff

### Health Checks

Create a health check endpoint:
```javascript
// src/api/health.js
export default function handler(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VITE_APP_VERSION,
    environment: process.env.VITE_APP_ENVIRONMENT
  };
  
  res.status(200).json(health);
}
```

### Monitoring Checklist

- [ ] Application loads successfully
- [ ] Wallet connection works
- [ ] Profile form submission works
- [ ] AI recommendations generate
- [ ] Payment flow completes
- [ ] Data persists to Supabase
- [ ] Error boundaries catch errors
- [ ] Performance metrics are acceptable
- [ ] SSL certificate is valid
- [ ] All environment variables are set

## Rollback Strategy

### Quick Rollback
```bash
# Rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback [deployment-url]
```

### Database Rollback
```sql
-- Create backup before major changes
CREATE TABLE user_profiles_backup AS SELECT * FROM user_profiles;
CREATE TABLE recommendations_backup AS SELECT * FROM recommendations;
CREATE TABLE payments_backup AS SELECT * FROM payments;
```

## Post-Deployment

### Verification Steps
1. Test all user flows end-to-end
2. Verify analytics are tracking
3. Check error monitoring is working
4. Test payment processing
5. Validate API integrations
6. Monitor performance metrics

### Go-Live Checklist
- [ ] Domain configured and SSL active
- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] Error monitoring configured
- [ ] Analytics tracking active
- [ ] Performance monitoring enabled
- [ ] Backup strategy in place
- [ ] Team has access to monitoring dashboards

---

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [Supabase Guides](https://supabase.com/docs)
- Contact support via the repository issues

Remember to test thoroughly in a staging environment before deploying to production!
