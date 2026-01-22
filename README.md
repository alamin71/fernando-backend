# Fernando Backend

A comprehensive streaming platform backend with user management, live streaming, and social features.

## Features

- 🔐 User Authentication & Authorization
- 📺 Live Streaming with AWS IVS
- 💳 Payment Integration with Stripe
- 📁 File Upload to AWS S3
- 👥 User Follow System
- 🎯 Category Management
- ⚙️ Admin Settings
- 🔄 Real-time Updates with Socket.IO
- 📧 Email Notifications
- 🔒 Security with Helmet, Rate Limiting, CORS

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Cache:** Redis
- **File Storage:** AWS S3
- **Streaming:** AWS IVS
- **Payment:** Stripe
- **Real-time:** Socket.IO
- **Authentication:** JWT

## Prerequisites

- Node.js >= 20.x
- MongoDB (Atlas or local)
- Redis (optional, can use Docker)
- AWS Account (S3, IVS)
- Stripe Account

## Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd fernando-backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:4000`

### 4. Seed Admin User

```bash
npm run seed
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed admin user

## Project Structure

```
fernando-backend/
├── src/
│   ├── app/
│   │   ├── builder/         # Query builders
│   │   ├── middleware/      # Express middleware
│   │   └── modules/         # Feature modules
│   │       ├── admin/
│   │       ├── auth/
│   │       ├── category/
│   │       ├── follow/
│   │       ├── stream/
│   │       └── user/
│   ├── config/              # Configuration files
│   ├── DB/                  # Database setup
│   ├── errors/              # Error handlers
│   ├── helpers/             # Utility helpers
│   ├── routes/              # Route definitions
│   ├── shared/              # Shared utilities
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── logs/                    # Application logs
├── .env.example             # Environment variables template
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Docker image definition
├── DEPLOYMENT_GUIDE.md      # Deployment instructions
└── package.json             # Dependencies & scripts
```

## API Documentation

Base URL: `/api/v1`

### Health Check

- `GET /api/v1/health` - Check server health status

### Authentication

- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token

### Users

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Streams

- `GET /api/v1/streams` - Get all streams
- `GET /api/v1/streams/:id` - Get stream by ID
- `POST /api/v1/streams` - Create new stream
- `PATCH /api/v1/streams/:id` - Update stream
- `DELETE /api/v1/streams/:id` - Delete stream

See [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for complete API documentation.

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 4000)
- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `STRIPE_SECRET_KEY` - Stripe API key

## Security

- JWT-based authentication
- Bcrypt password hashing
- Helmet security headers
- CORS configuration
- Rate limiting
- Input validation with Zod
- MongoDB injection protection

## Monitoring & Logging

- Winston for application logging
- Daily rotating log files
- Separate error and success logs
- Morgan for HTTP request logging

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For support, email support@fernando.com or create an issue in the repository.
