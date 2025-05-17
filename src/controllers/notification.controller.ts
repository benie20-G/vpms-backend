
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    
    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Check if user has permission to mark this notification
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    
    res.json(updatedNotification);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Mark all user's notifications as read
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Helper function to create notifications (used internally)
export const createNotification = async ({
  userId,
  message,
}: {
  userId: string;
  message: string;
}) => {
  return prisma.notification.create({
    data: {
      userId,
      message,
      read: false,
    },
  });
};
