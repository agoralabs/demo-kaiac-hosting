# Backend Server

## Quick Start
```bash
cd backend
npm install
npm run verify
# If verification passes:
npm start
```

## Included Security Features
- CORS protection with configurable origin
- Helmet security headers
- Rate limiting (100 requests per 15 minutes per IP)
- Compression for performance
- Error handling middleware
- Request logging with Morgan

## Environment Variables
See `.env.example` for required configuration.

## Troubleshooting
If the server fails to start:
1. Run `npm run verify` to check installation
2. Check MySQL database connection
3. Verify environment variables
4. Check console for detailed error messages