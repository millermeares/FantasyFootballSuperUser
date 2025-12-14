# AWS Amplify Deployment Guide

## Prerequisites

1. **AWS Account** with Amplify access
2. **GitHub Repository** with your code
3. **Node.js 18+** for local development

## Deployment Steps

### 1. Connect Repository to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Select the branch (usually `main` or `master`)

### 2. Build Settings

Amplify will automatically detect the `amplify.yml` file. The configuration includes:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 3. Environment Variables (Optional)

If you need to override any environment variables in production:

1. Go to App Settings → Environment variables
2. Add any custom variables (none required for basic deployment)

### 4. Domain Configuration

#### Custom Domain (Optional)
1. Go to Domain management
2. Add your custom domain
3. Amplify will handle SSL certificate provisioning automatically

#### HTTPS
- **Automatic**: Amplify provides HTTPS by default
- **Custom domains**: SSL certificates are automatically provisioned
- **No changes needed**: Your app already uses HTTPS for API calls

## Security Features

### Content Security Policy
The app includes CSP headers in `index.html`:
- Allows connections to Sleeper API (`https://api.sleeper.app`)
- Restricts other external connections
- Prevents XSS attacks

### Security Headers
Configured in `public/_redirects`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Performance Optimizations

### Build Optimizations
- **Code splitting**: Vendor and API chunks separated
- **Minification**: Terser minification enabled
- **Source maps**: Available for debugging
- **Caching**: Node modules cached between builds

### Runtime Optimizations
- **Service Worker**: Ready for PWA features
- **Manifest**: Progressive Web App manifest included
- **Responsive**: Mobile-optimized with proper viewport settings

## Monitoring and Debugging

### Build Logs
- Available in Amplify Console
- Shows npm install and build process
- Displays any errors or warnings

### Performance Monitoring
```bash
# Local performance analysis
npm run build:analyze
```

### Testing Before Deployment
```bash
# Run all tests
npm run test:ci

# Build and preview locally
npm run deploy:preview
```

## Troubleshooting

### Common Issues

#### Build Failures
1. **Node version**: Ensure using Node 18+
2. **Dependencies**: Run `npm ci` locally to verify
3. **TypeScript errors**: Fix any type errors before deployment

#### Runtime Issues
1. **API calls**: All Sleeper API calls use HTTPS (no mixed content issues)
2. **Local storage**: Works correctly in HTTPS environment
3. **CORS**: Sleeper API allows cross-origin requests

#### Performance Issues
1. **Bundle size**: Use `npm run build:analyze` to check
2. **Caching**: Amplify handles static asset caching automatically
3. **CDN**: Global CDN distribution included

### Environment-Specific Debugging

#### Production Environment
- Source maps available for debugging
- Console errors logged in browser dev tools
- Network tab shows API request/response details

#### Local Development
```bash
# Start development server
npm run dev

# Preview production build locally
npm run preview
```

## Post-Deployment Checklist

- [ ] App loads correctly on desktop and mobile
- [ ] User can enter Sleeper identifier and load teams
- [ ] Team selection works and updates tables
- [ ] Week selector functions properly
- [ ] Player tables display and sort correctly
- [ ] League info popup works when clicking counts
- [ ] Error handling works for invalid inputs
- [ ] Performance is acceptable (< 3s initial load)
- [ ] Mobile responsiveness works across devices
- [ ] HTTPS certificate is active and valid

## Continuous Deployment

### Automatic Deployments
- **Enabled by default**: Pushes to connected branch trigger deployments
- **Build time**: Typically 2-5 minutes
- **Rollback**: Previous versions available in Amplify Console

### Branch-Based Deployments
- **Main branch**: Production deployment
- **Feature branches**: Can be configured for preview deployments
- **Pull requests**: Can trigger preview builds

## Cost Optimization

### Amplify Pricing
- **Build minutes**: ~2-5 minutes per deployment
- **Storage**: Minimal for this SPA
- **Bandwidth**: Pay per GB served
- **Free tier**: 1000 build minutes/month, 15GB storage, 100GB bandwidth

### Optimization Tips
1. **Efficient builds**: Cache node_modules (already configured)
2. **Asset optimization**: Images and assets are minified
3. **Code splitting**: Reduces initial bundle size
4. **Caching**: Proper cache headers set for static assets

## Support and Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Deployment Best Practices](https://create-react-app.dev/docs/deployment/)