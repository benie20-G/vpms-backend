
const { Router } = require('express');
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const notificationRoutes = Router();

// All notification routes require authentication
notificationRoutes.use(authenticate);
notificationRoutes.get('/', NotificationController.getUserNotifications);
notificationRoutes.put('/:id/read', NotificationController.markNotificationAsRead);
notificationRoutes.put('/read-all', NotificationController.markAllNotificationsAsRead);
module.exports = notificationRoutes;