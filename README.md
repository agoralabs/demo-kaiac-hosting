# KaiaC Hosting Platform

A full-stack web application for WordPress hosting services with subscription management, payment processing, and user account management.

## Project Overview

KaiaC Hosting is a comprehensive hosting platform that allows users to:
- Create and manage WordPress hosting accounts
- Subscribe to different hosting plans
- Process payments through Stripe
- Manage websites, storage, and resources
- Generate and download invoices
- Track subscription history and usage

## Tech Stack

### Frontend
- Next.js (React framework)
- Tailwind CSS for styling
- Axios for API requests
- Stripe JS for payment processing
- Heroicons for UI elements

### Backend
- Node.js with Express
- MySQL database with Sequelize ORM
- JWT authentication
- Redis for session management
- AWS SDK for cloud integrations
- PDFKit for invoice generation
- Stripe API for payment processing

## Project Structure

```
demo-kaiac-hosting/
├── frontend/               # Next.js frontend application
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and API clients
│   ├── pages/              # Application pages and routes
│   └── styles/             # CSS and Tailwind styles
│
├── backend/                # Express.js backend application
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/             # Sequelize database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   └── utils/              # Utility functions
│
└── devfile.yaml            # Development environment configuration
```

## Key Features

- **User Authentication**: Secure signup, login, and profile management
- **Plan Management**: Browse and subscribe to different hosting plans
- **Website Management**: Create, configure, and manage WordPress sites
- **Subscription Handling**: Upgrade, downgrade, or cancel subscriptions
- **Payment Processing**: Secure payment handling with Stripe
- **Invoice Generation**: Create and download PDF invoices
- **Usage Monitoring**: Track resource usage for subscriptions
- **Admin Dashboard**: Manage users, plans, and system settings

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- Redis server (optional, for session management)
- Stripe account for payment processing

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd demo-kaiac-hosting
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your API URL (default: http://localhost:3001)
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 3001)
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`: MySQL connection details
- `JWT_SECRET`: Secret for JWT token generation
- `STRIPE_SECRET_KEY`: Stripe API key for payment processing
- `REDIS_URL`: Redis connection string (optional)
- `AWS_*`: AWS credentials for cloud services (if used)

### Frontend (.env)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001)
- `NEXT_PUBLIC_STRIPE_KEY`: Stripe publishable key

## API Routes

The backend provides a comprehensive API for all platform functionality:

- **User Management**: Authentication, profile management
- **Plan Management**: Available hosting plans and features
- **Order Processing**: Create and manage orders
- **Subscription Handling**: Create, upgrade, and cancel subscriptions
- **Website Management**: Create and configure WordPress sites
- **Storage Management**: Track and manage storage usage
- **Invoice Generation**: Create and download invoices
- **Admin Functions**: User and system management

## Deployment

The application can be deployed using:
- Docker containers
- AWS services (EC2, RDS, S3)
- Traditional VPS hosting

Refer to deployment documentation for specific instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).
