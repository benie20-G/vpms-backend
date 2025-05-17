
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { sendEmail } from '../lib/email';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';

// Validation schemas
const createRequestSchema = z.object({
  vehicleId: z.string(),
});

const updateRequestSchema = z.object({
  vehicleId: z.string().optional(),
});

const approveRequestSchema = z.object({
  slotId: z.string(),
});

const rejectRequestSchema = z.object({
  note: z.string(),
});

export const getAllSlotRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      page = '1', 
      limit = '10',
      search = '',
      status,
      userId
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Build where filter
    const where: Prisma.SlotRequestWhereInput = {};
    
    // Users can only see their own requests, admins can see all
    if (req.user?.role !== 'ADMIN') {
      where.userId = req.user!.id;
    } else if (userId) {
      where.userId = userId as string;
    }
    
    if (status) {
      where.status = status as Prisma.EnumRequestStatusFilter;
    }
    
    if (search) {
      where.OR = [
        {
          vehicle: {
            plateNumber: { contains: search as string, mode: 'insensitive' },
          },
        },
        {
          user: {
            name: { contains: search as string, mode: 'insensitive' },
          },
        },
      ];
    }
    
    // Get total count
    const total = await prisma.slotRequest.count({ where });
    
    // Get paginated requests
    const requests = await prisma.slotRequest.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: {
        requestTime: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        vehicle: true,
        parkingSlot: true,
      },
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNumber);
    
    res.json({
      requests,
      pagination: {
        total,
        page: pageNumber,
        totalPages,
        perPage: limitNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSlotRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const request = await prisma.slotRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        vehicle: true,
        parkingSlot: true,
      },
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Slot request not found' });
    }
    
    // Users can only see their own requests, admins can see all
    if (req.user?.role !== 'ADMIN' && request.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json({ request });
  } catch (error) {
    next(error);
  }
};

export const createSlotRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vehicleId } = createRequestSchema.parse(req.body);
    
    // Verify vehicle exists and belongs to user
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    if (vehicle.ownerId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only request slots for your own vehicles' });
    }
    
    // Check if vehicle already has a pending or approved request
    const activeRequest = await prisma.slotRequest.findFirst({
      where: {
        vehicleId,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
      },
    });
    
    if (activeRequest) {
      return res.status(400).json({ 
        error: activeRequest.status === 'PENDING' 
          ? 'A pending request already exists for this vehicle' 
          : 'This vehicle already has an approved parking slot'
      });
    }
    
    // Check if vehicle has an active parking session
    const activeSession = await prisma.parkingSession.findFirst({
      where: {
        vehicleId,
        status: 'ACTIVE',
      },
    });
    
    if (activeSession) {
      return res.status(400).json({ error: 'Vehicle already has an active parking session' });
    }
    
    // Create request
    const request = await prisma.slotRequest.create({
      data: {
        userId: req.user!.id,
        vehicleId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        vehicle: true,
      },
    });
    
    // Notify all admins about the new request
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });
    
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          message: `New parking slot request from ${request.user.name} for vehicle ${request.vehicle.plateNumber}`,
        },
      });
    }
    
    res.status(201).json({ request });
  } catch (error) {
    next(error);
  }
};

export const updateSlotRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = updateRequestSchema.parse(req.body);
    
    // Check if request exists
    const existingRequest = await prisma.slotRequest.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });
    
    if (!existingRequest) {
      return res.status(404).json({ error: 'Slot request not found' });
    }
    
    // Only the user who created the request can update it
    if (existingRequest.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Can only update pending requests
    if (existingRequest.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending requests can be updated' });
    }
    
    // If changing vehicle, verify it belongs to the user
    if (updateData.vehicleId && updateData.vehicleId !== existingRequest.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: updateData.vehicleId },
      });
      
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      if (vehicle.ownerId !== req.user?.id) {
        return res.status(403).json({ error: 'You can only use your own vehicles' });
      }
      
      // Check if vehicle already has a pending or approved request
      const activeRequest = await prisma.slotRequest.findFirst({
        where: {
          vehicleId: updateData.vehicleId,
          status: {
            in: ['PENDING', 'APPROVED'],
          },
          id: { not: id }, // Exclude this request
        },
      });
      
      if (activeRequest) {
        return res.status(400).json({ 
          error: activeRequest.status === 'PENDING' 
            ? 'A pending request already exists for this vehicle' 
            : 'This vehicle already has an approved parking slot'
        });
      }
      
      // Check if vehicle has an active parking session
      const activeSession = await prisma.parkingSession.findFirst({
        where: {
          vehicleId: updateData.vehicleId,
          status: 'ACTIVE',
        },
      });
      
      if (activeSession) {
        return res.status(400).json({ error: 'Vehicle already has an active parking session' });
      }
    }
    
    // Update request
    const updatedRequest = await prisma.slotRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        vehicle: true,
      },
    });
    
    // Notify admins about the updated request
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });
    
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          message: `Parking slot request ${id} updated by ${updatedRequest.user.name}`,
        },
      });
    }
    
    res.json({ request: updatedRequest });
  } catch (error) {
    next(error);
  }
};

export const deleteSlotRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    // Check if request exists
    const existingRequest = await prisma.slotRequest.findUnique({
      where: { id },
    });
    
    if (!existingRequest) {
      return res.status(404).json({ error: 'Slot request not found' });
    }
    
    // Only the user who created the request or an admin can delete it
    if (req.user?.role !== 'ADMIN' && existingRequest.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Can only delete pending requests
    if (existingRequest.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending requests can be deleted' });
    }
    
    // Delete request
    await prisma.slotRequest.delete({
      where: { id },
    });
    
    res.json({ message: 'Slot request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const approveSlotRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only admins can approve requests
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can approve requests' });
    }
    
    const { id } = req.params;
    const { slotId } = approveRequestSchema.parse(req.body);
    
    // Check if request exists
    const request = await prisma.slotRequest.findUnique({
      where: { id },
      include: {
        user: true,
        vehicle: true,
      },
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Slot request not found' });
    }
    
    // Can only approve pending requests
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Request is already ${request.status.toLowerCase()}` });
    }
    
    // Check if slot exists and is available
    const slot = await prisma.parkingSlot.findUnique({
      where: { id: slotId },
    });
    
    if (!slot) {
      return res.status(404).json({ error: 'Parking slot not found' });
    }
    
    if (slot.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Parking slot is not available' });
    }
    
    // Check if slot is compatible with vehicle
    if (slot.vehicleType !== request.vehicle.vehicleType) {
      return res.status(400).json({ error: `Slot is for ${slot.vehicleType} vehicles, but vehicle is ${request.vehicle.vehicleType}` });
    }
    
    if (slot.size !== request.vehicle.size && 
        !(slot.size === 'LARGE' && ['MEDIUM', 'SMALL'].includes(request.vehicle.size)) && 
        !(slot.size === 'MEDIUM' && request.vehicle.size === 'SMALL')) {
      return res.status(400).json({ error: `Slot size ${slot.size} is not compatible with vehicle size ${request.vehicle.size}` });
    }
    
    // Update slot status to occupied
    await prisma.parkingSlot.update({
      where: { id: slotId },
      data: { status: 'OCCUPIED' },
    });
    
    // Create parking session for the vehicle
    const session = await prisma.parkingSession.create({
      data: {
        vehicleId: request.vehicleId,
        slotId,
        requestId: id,
        status: 'ACTIVE',
      },
    });
    
    // Update request status
    const updatedRequest = await prisma.slotRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        responseTime: new Date(),
        slotId,
      },
      include: {
        user: true,
        vehicle: true,
        parkingSlot: true,
      },
    });
    
    // Notify user about approval
    await prisma.notification.create({
      data: {
        userId: request.userId,
        message: `Your parking slot request has been approved. Slot: ${slot.slotNumber}, Location: ${slot.location}`,
      },
    });
    
    // Send email to user
    try {
      const templatePath = path.join(__dirname, '../templates/slot-approved-email.html');
      const source = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(source);
      const html = template({
        name: request.user.name,
        vehicleInfo: `${request.vehicle.plateNumber} (${request.vehicle.vehicleType})`,
        slotNumber: slot.slotNumber,
        slotLocation: slot.location,
      });
      
      await sendEmail({
        to: request.user.email,
        subject: 'NePark: Your Parking Slot Request Has Been Approved',
        html,
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
    
    res.json({ request: updatedRequest, session });
  } catch (error) {
    next(error);
  }
};

export const rejectSlotRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only admins can reject requests
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can reject requests' });
    }
    
    const { id } = req.params;
    const { note } = rejectRequestSchema.parse(req.body);
    
    // Check if request exists
    const request = await prisma.slotRequest.findUnique({
      where: { id },
      include: {
        user: true,
        vehicle: true,
      },
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Slot request not found' });
    }
    
    // Can only reject pending requests
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Request is already ${request.status.toLowerCase()}` });
    }
    
    // Update request status
    const updatedRequest = await prisma.slotRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        responseTime: new Date(),
        responseNote: note,
      },
      include: {
        user: true,
        vehicle: true,
      },
    });
    
    // Notify user about rejection
    await prisma.notification.create({
      data: {
        userId: request.userId,
        message: `Your parking slot request has been rejected. Reason: ${note}`,
      },
    });
    
    // Send email to user
    try {
      const templatePath = path.join(__dirname, '../templates/slot-rejected-email.html');
      const source = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(source);
      const html = template({
        name: request.user.name,
        vehicleInfo: `${request.vehicle.plateNumber} (${request.vehicle.vehicleType})`,
        reason: note,
      });
      
      await sendEmail({
        to: request.user.email,
        subject: 'NePark: Your Parking Slot Request Has Been Rejected',
        html,
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
    
    res.json({ request: updatedRequest });
  } catch (error) {
    next(error);
  }
};
