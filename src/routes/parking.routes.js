const { Router } = require('express');
const ParkingController = require('../controllers/parking.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const parkingRoutes = Router();

// All parking routes require authentication
parkingRoutes.use(authenticate);

/**
 * @swagger
 * /api/parking:
 *   get:
 *     summary: Get parking sessions (admin gets all, users get their own)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PENDING_PAYMENT, COMPLETED]
 *         description: Filter by session status
 *     responses:
 *       200:
 *         description: List of parking sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParkingSession'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkingRoutes.get('/', ParkingController.getParkingSessions);

/**
 * @swagger
 * /api/parking/checkin:
 *   post:
 *     summary: Check in a vehicle
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "12345"
 *             required:
 *               - vehicleId
 *     responses:
 *       201:
 *         description: Vehicle checked in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingSession'
 *       400:
 *         description: Vehicle is already checked in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not your vehicle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkingRoutes.post('/checkin', ParkingController.checkInVehicle);

/**
 * @swagger
 * /api/parking/request-checkout/{sessionId}:
 *   post:
 *     summary: Request checkout for a vehicle
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parking session ID
 *     responses:
 *       200:
 *         description: Checkout request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Checkout requested successfully"
 *                 session:
 *                   $ref: '#/components/schemas/ParkingSession'
 *       400:
 *         description: Parking session is not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not your vehicle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Parking session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkingRoutes.post('/request-checkout/:sessionId', ParkingController.requestCheckout);

/**
 * @swagger
 * /api/parking/checkout/{sessionId}:
 *   post:
 *     summary: Check out a vehicle (admin only)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parking session ID
 *     responses:
 *       200:
 *         description: Vehicle checked out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParkingSession'
 *       400:
 *         description: Parking session cannot be checked out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Parking session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkingRoutes.post('/checkout/:sessionId', authorizeAdmin, ParkingController.checkOutVehicle);
module.exports = parkingRoutes;