
const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');


const authRoutes = Router();
authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.post('/forgot-password', AuthController.forgotPassword);
authRoutes.post('/reset-password', AuthController.resetPassword);

module.exports={
    authRoutes
}