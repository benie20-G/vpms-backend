
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createNotification } from './notification.controller';

// Validation schemas
const checkInSchema = z.object({
  vehicleId: z.string(),
});

const getParkingSessions = async (
  req,
  res,
  next
) => {
  try {
    const { vehicleId, status } = req.query;
    
    // Build filters
    const filters = {};
    
    if (vehicleId) {
      filters.vehicleId = vehicleId;
    }
    
    if (status) {
      filters.status = status;
    }
    
    // Admins can see all sessions, users can only see their own vehicles' sessions
    const sessions = req.user?.role === 'ADMIN'
      ? await prisma.parkingSession.findMany({
          where: filters,
          include: {
            vehicle: {
              include: {
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
          orderBy: {
            entryTime: 'desc',
          },
        })
      : await prisma.parkingSession.findMany({
          where: {
            ...filters,
            vehicle: {
              ownerId: req.user?.id,
            },
          },
          include: {
            vehicle: {
              include: {
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
          orderBy: {
            entryTime: 'desc',
          },
        });
    
    
    res.json(transformedSessions);
  } catch (error) {
    next(error);
  }
};

const checkInVehicle = async (
  req,
  res,
  next
) => {
  try {
    const { vehicleId } = checkInSchema.parse(req.body);
    
    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        owner: true,
      },
    });
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Check if user has permission to check in this vehicle
    if (req.user?.role !== 'ADMIN' && vehicle.ownerId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Check if vehicle is already checked in
    const activeSession = await prisma.parkingSession.findFirst({
      where: {
        vehicleId,
        status: 'ACTIVE',
      },
    });
    
    if (activeSession) {
      return res.status(400).json({ error: 'Vehicle is already checked in' });
    }
    
    // Create new session
    const session = await prisma.parkingSession.create({
      data: {
        slotId,
        vehicleId,
        status: 'ACTIVE',
      },
      include: {
        vehicle: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
    
    // Send notification to vehicle owner
    if (vehicle.ownerId) {
      await createNotification({
        userId: vehicle.ownerId,
        message: `Your vehicle ${vehicle.vehicleType} (${vehicle.plateNumber}) has been checked in.`,
      });
    }
    
    
    res.status(201).json(transformedSession);
  } catch (error) {
    next(error);
  }
};

const requestCheckout = async (
  req,
  res,
  next
) => {
  try {
    const { sessionId } = req.params;
    
    // Find the session
    const session = await prisma.parkingSession.findUnique({
      where: { id: sessionId },
      include: {
        vehicle: {
          include: {
            owner: true,
          },
        },
      },
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Parking session not found' });
    }
    
    // Check if user has permission (must be vehicle owner)
    if (req.user?.role !== 'ADMIN' && session.vehicle.ownerId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Check if session is active
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Parking session is not active' });
    }
    
    // Update session status to pending payment
    const updatedSession = await prisma.parkingSession.update({
      where: { id: sessionId },
      data: {
        status: 'PENDING_PAYMENT',
      },
      include: {
        vehicle: true,
      },
    });
    
    // Notify all admins about the checkout request
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });
    
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        message: `Checkout requested for vehicle ${session.vehicle.plateNumber} (${session.vehicle.size} ${session.vehicle.vehicleType})`,
      });
    }
    
    res.json({
      message: 'Checkout requested successfully',
      session: updatedSession,
    });
  } catch (error) {
    next(error);
  }
};

const checkOutVehicle = async (
  req,
  res ,
  next 
) => {
  try {
    const { sessionId } = req.params;
    
    // Only admins can check out vehicles
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can check out vehicles' });
    }
    
    // Find the session
    const session = await prisma.parkingSession.findUnique({
      where: { id: sessionId },
      include: {
        vehicle: {
          include: {
            owner: true,
          },
        },
      },
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Parking session not found' });
    }
    
    // Check if session is active or pending payment
    if (session.status !== 'ACTIVE' && session.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ error: 'Parking session cannot be checked out' });
    }
    
    const exitTime = new Date();
    
    // Calculate duration in hours
    const entryTime = new Date(session.entryTime);
    const durationHours = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
    
    // Calculate fee: 200RWF per hour, minimum 200RWF
    const fee = Math.max(200, Math.ceil(durationHours) * 200);
    
    // Update session
    const updatedSession = await prisma.parkingSession.update({
      where: { id: sessionId },
      data: {
        exitTime,
        fee,
        status: 'COMPLETED',
      },
      include: {
        vehicle: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
    
    // Send notification to vehicle owner
    if (session.vehicle.ownerId) {
      await createNotification({
        userId: session.vehicle.ownerId,
        message: `Your vehicle ${session.vehicle.size} ${session.vehicle.vehicleType} (${session.vehicle.plateNumber}) has been checked out. Fee: $${fee.toFixed(2)}`,
      });
    }
    
    // Transform data to match frontend expectations
    const transformedSession = {
      id: updatedSession.id,
      vehicleId: updatedSession.vehicleId,
      entryTime: updatedSession.entryTime,
      exitTime: updatedSession.exitTime,
      fee: updatedSession.fee,
      status: updatedSession.status,
      vehicle: updatedSession.vehicle ? {
        id: updatedSession.vehicle.id,
        plateNumber: updatedSession.vehicle.plateNumber,
        size: updatedSession.vehicle.size,
        vehicleType: updatedSession.vehicle.vehicleType,
        color: updatedSession.vehicle.color,
        ownerId: updatedSession.vehicle.ownerId,
        ownerName: updatedSession.vehicle.owner?.name || '',
        ownerEmail: updatedSession.vehicle.owner?.email || '',
        ownerPhone: updatedSession.vehicle.owner?.phoneNumber || '',
      } : undefined,
    };
    
    res.json(transformedSession);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getParkingSessions,
  checkInVehicle,
  requestCheckout,
  checkOutVehicle,
};
