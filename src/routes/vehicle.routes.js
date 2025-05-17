
const { Router } = require('express');
const {getAllVehicles,getVehicleById,deleteVehicle,updateVehicle,createVehicle} = require('../controllers/vehicle.controller')
const vehicleRoutes = Router();
const {authenticate} = require('../middleware/auth.middleware')

// All vehicle routes require authentication
vehicleRoutes.use(authenticate);
vehicleRoutes.get('/',getAllVehicles);
vehicleRoutes.get('/:id',getVehicleById);
vehicleRoutes.post('/',createVehicle);
vehicleRoutes.put('/:id',updateVehicle);
vehicleRoutes.delete('/:id',deleteVehicle);
module.exports = {vehicleRoutes }