
import { Router } from 'express';
import * as ParkingSlotController from '../controllers/parking-slot.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

export const parkingSlotRoutes = Router();

// All routes require authentication
parkingSlotRoutes.use(authenticate);

/**
 * @swagger
 * /api/parking-slots:
 *   get:
 *     summary: Get all parking slots (admin gets all, users get available slots)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by slot number or location
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, MAINTENANCE]
 *         description: Filter by slot status
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [CAR, MOTORCYCLE, TRUCK, VAN, BUS]
 *         description: Filter by vehicle type
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [SMALL, MEDIUM, LARGE]
 *         description: Filter by size
 *     responses:
 *       200:
 *         description: List of parking slots with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slots:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ParkingSlot'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkingSlotRoutes.get('/', ParkingSlotController.getAllParkingSlots);

/**
 * @swagger
 * /api/parking-slots/{id}:
 *   get:
 *     summary: Get parking slot by ID
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parking Slot ID
 *     responses:
 *       200:
 *         description: Parking slot details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slot:
 *                   $ref: '#/components/schemas/ParkingSlot'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Parking slot not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkingSlotRoutes.get('/:id', ParkingSlotController.getParkingSlotById);

/**
 * @swagger
 * /api/parking-slots:
 *   post:
 *     summary: Create a new parking slot (admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slotNumber:
 *                 type: string
 *                 example: "A-001"
 *               location:
 *                 type: string
 *                 example: "Block A, Floor 1"
 *               size:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE]
 *               vehicleType:
 *                 type: string
 *                 enum: [CAR, MOTORCYCLE, TRUCK, VAN, BUS]
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, OCCUPIED, MAINTENANCE]
 *             required:
 *               - slotNumber
 *               - location
 *               - size
 *               - vehicleType
 *     responses:
 *       201:
 *         description: Parking slot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slot:
 *                   $ref: '#/components/schemas/ParkingSlot'
 *       400:
 *         description: Slot number already exists
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
 */
parkingSlotRoutes.post('/', ParkingSlotController.createParkingSlot);

/**
 * @swagger
 * /api/parking-slots/{id}:
 *   put:
 *     summary: Update a parking slot (admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parking Slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slotNumber:
 *                 type: string
 *               location:
 *                 type: string
 *               size:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE]
 *               vehicleType:
 *                 type: string
 *                 enum: [CAR, MOTORCYCLE, TRUCK, VAN, BUS]
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, OCCUPIED, MAINTENANCE]
 *     responses:
 *       200:
 *         description: Parking slot updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slot:
 *                   $ref: '#/components/schemas/ParkingSlot'
 *       400:
 *         description: Validation error
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
 *         description: Parking slot not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkingSlotRoutes.put('/:id', ParkingSlotController.updateParkingSlot);

/**
 * @swagger
 * /api/parking-slots/{id}:
 *   delete:
 *     summary: Delete a parking slot (admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parking Slot ID
 *     responses:
 *       200:
 *         description: Parking slot deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete slot with active sessions
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
 *         description: Parking slot not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkingSlotRoutes.delete('/:id', ParkingSlotController.deleteParkingSlot);

/**
 * @swagger
 * /api/parking-slots/seed:
 *   post:
 *     summary: Seed 100 parking slots (admin only)
 *     tags: [Parking Slots]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parking slots seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Parking slots already exist
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
 */
parkingSlotRoutes.post('/seed', authorizeAdmin, ParkingSlotController.seedParkingSlots);
