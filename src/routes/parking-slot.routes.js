
const { Router } = require('express');
const ParkingSlotController = require('../controllers/parking-slot.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const parkingSlotRoutes = Router();

// All routes require authentication
parkingSlotRoutes.use(authenticate);
parkingSlotRoutes.get('/', ParkingSlotController.getAllParkingSlots);
parkingSlotRoutes.get('/:id', ParkingSlotController.getParkingSlotById);
parkingSlotRoutes.post('/', ParkingSlotController.createParkingSlot);
parkingSlotRoutes.put('/:id', ParkingSlotController.updateParkingSlot);
parkingSlotRoutes.delete('/:id', ParkingSlotController.deleteParkingSlot);
parkingSlotRoutes.post('/seed', authorizeAdmin, ParkingSlotController.seedParkingSlots);

module.exports = parkingSlotRoutes;