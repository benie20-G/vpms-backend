const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const {authRoutes} = require('./routes/auth.routes');
const { vehicleRoutes } = require('./routes/vehicle.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./lib/prisma');
const userRoutes = require('./routes/user.routes');
const parkingRoutes = require('./routes/parking.routes');
const notificationRoutes = require('./routes/notification.routes');
const slotRequestRoutes = require('./routes/slot-request.routes');
const parkingSlotRoutes = require('./routes/parking-slot.routes');


// Load environment variables
dotenv.config();

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NePark API',
      version: '1.0.0',
      description: 'API documentation for NePark parking management system',
      contact: {
        name: 'Benie Giramata',
        email: 'iratuzibeniegiramata@gmail.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            phoneNumber: { type: 'string' },
            profilePicture: { type: 'string' },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            plateNumber: { type: 'string' },
            vehicleType: { type: 'string', enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS'] },
            size: { type: 'string', enum: ['SMALL', 'MEDIUM', 'LARGE'] },
            color: { type: 'string' },
            ownerId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ParkingSlot: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slotNumber: { type: 'string' },
            location: { type: 'string' },
            size: { type: 'string', enum: ['SMALL', 'MEDIUM', 'LARGE'] },
            vehicleType: { type: 'string', enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS'] },
            status: { type: 'string', enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SlotRequest: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            vehicleId: { type: 'string' },
            slotId: { type: 'string', nullable: true },
            requestTime: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            responseTime: { type: 'string', format: 'date-time', nullable: true },
            responseNote: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ParkingSession: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            vehicleId: { type: 'string' },
            slotId: { type: 'string' },
            requestId: { type: 'string', nullable: true },
            entryTime: { type: 'string', format: 'date-time' },
            exitTime: { type: 'string', format: 'date-time', nullable: true },
            fee: { type: 'number', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'PENDING_PAYMENT', 'COMPLETED'] },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            message: { type: 'string' },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            totalPages: { type: 'number' },
            perPage: { type: 'number' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication operations' },
      { name: 'Users', description: 'User operations' },
      { name: 'Vehicles', description: 'Vehicle operations' },
      { name: 'Parking', description: 'Parking operations' },
      { name: 'Parking Slots', description: 'Parking slot operations' },
      { name: 'Slot Requests', description: 'Slot request operations' },
      { name: 'Notifications', description: 'Notification operations' },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs in routes files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('api/users',userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('api/parking',parkingRoutes)
app.use('/api/norifications',notificationRoutes)
app.use('/api/slot-requests',slotRequestRoutes)
app.use('/api/parking-slots',parkingSlotRoutes)
// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger Documentation available at http://localhost:${PORT}/api-docs`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
