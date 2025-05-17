const { Router } = require('express');
const ParkingController = require('../controllers/parking.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const parkingRoutes = Router();

// All parking routes require authentication
parkingRoutes.use(authenticate);
parkingRoutes.get('/', ParkingController.getParkingSessions);
parkingRoutes.post('/checkin', ParkingController.checkInVehicle);
parkingRoutes.post('/request-checkout/:sessionId', ParkingController.requestCheckout);
parkingRoutes.post('/checkout/:sessionId', authorizeAdmin, ParkingController.checkOutVehicle);
module.exports = parkingRoutes;