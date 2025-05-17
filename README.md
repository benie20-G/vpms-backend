
# Parking Management System - Backend

This is the backend for the Parking Management System, built with Node.js, Express, TypeScript, and Prisma with PostgreSQL.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (running on port 5432)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd backend
npm install
```

3. Set up your environment variables:
   
   Copy the `.env.example` file to `.env` and update the values as needed.

4. Set up the database:

```bash
# Generate Prisma client
npm run prisma:generate

# Create the database and run migrations
npm run prisma:migrate
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token

### Users

- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `PUT /api/users/password` - Update password
- `GET /api/users` - Admin only: Get all users

### Vehicles

- `GET /api/vehicles` - Get all vehicles (admin) or user's vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create a new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Parking

- `GET /api/parking` - Get parking sessions
- `POST /api/parking/checkin` - Check in a vehicle
- `POST /api/parking/request-checkout/:sessionId` - Request checkout
- `POST /api/parking/checkout/:sessionId` - Admin only: Complete checkout

### Notifications

- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
