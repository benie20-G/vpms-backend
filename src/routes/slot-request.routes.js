const { Router } = require('express');
const SlotRequestController = require('../controllers/slot-request.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const slotRequestRoutes = Router();

// All routes require authentication
slotRequestRoutes.use(authenticate);
slotRequestRoutes.get('/', SlotRequestController.getAllSlotRequests);
slotRequestRoutes.get('/:id', SlotRequestController.getSlotRequestById);
slotRequestRoutes.post('/{vehicleId}', SlotRequestController.createSlotRequest);
slotRequestRoutes.post('/:id/approve', authorizeAdmin, SlotRequestController.approveSlotRequest);
slotRequestRoutes.post('/:id/reject', authorizeAdmin, SlotRequestController.rejectSlotRequest);
module.exports = slotRequestRoutes;