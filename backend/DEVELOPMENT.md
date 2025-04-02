# Development Guide

## First Time Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your environment:
```bash
cp .env.example .env
```

3. Configure your database settings in .env

4. Configure your Stripe keys:
- Get your Stripe secret key from the Stripe dashboard
- Set up webhook endpoint in Stripe dashboard and get the webhook secret
- Add both to your .env file

5. Start the development server:
```bash
npm run dev
```

## Database Migrations

When you make changes to models, uncomment the sync line in index.js temporarily:
```javascript
await sequelize.sync({ alter: true });
```

Then restart the server once to apply changes.

## Testing

1. Use the health check endpoint to verify the server is running:
```bash
curl http://localhost:3001/health
```

2. Test database connection by checking startup logs

3. Test Stripe integration:
```bash
curl http://localhost:3001/api/orders/create-payment -X POST \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'
```