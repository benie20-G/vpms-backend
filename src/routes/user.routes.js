
const { Router } = require('express');
const UserController = require('../controllers/user.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const userRoutes = Router();

// All user routes require authentication
userRoutes.use(authenticate);
userRoutes.put('/profile', UserController.updateUserProfile);
userRoutes.put('/password', UserController.updatePassword);
userRoutes.get('/', authorizeAdmin, UserController.getAllUsers);

module.exports = userRoutes;