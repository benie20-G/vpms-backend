
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

// Validation schemas
const createSlotSchema = z.object({
  slotNumber: z.string(),
  location: z.string(),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS']),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']).optional(),
});

const updateSlotSchema = z.object({
  slotNumber: z.string().optional(),
  location: z.string().optional(),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS']).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']).optional(),
});

export const getAllParkingSlots = async (
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
      vehicleType,
      size
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Build where filter
    const where: Prisma.ParkingSlotWhereInput = {};
    
    if (search) {
      where.OR = [
        { slotNumber: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status as Prisma.EnumSlotStatusFilter;
    }
    
    if (vehicleType) {
      where.vehicleType = vehicleType as Prisma.EnumVehicleTypeFilter;
    }
    
    if (size) {
      where.size = size as Prisma.EnumVehicleSizeFilter;
    }
    
    // Get total count
    const total = await prisma.parkingSlot.count({ where });
    
    // Get paginated slots
    const slots = await prisma.parkingSlot.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: {
        slotNumber: 'asc',
      },
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNumber);
    
    res.json({
      slots,
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

export const getParkingSlotById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const slot = await prisma.parkingSlot.findUnique({
      where: { id },
    });
    
    if (!slot) {
      return res.status(404).json({ error: 'Parking slot not found' });
    }
    
    res.json({ slot });
  } catch (error) {
    next(error);
  }
};

export const createParkingSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only admins can create parking slots
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can create parking slots' });
    }
    
    const slotData = createSlotSchema.parse(req.body);
    
    // Check if slot number already exists
    const existingSlot = await prisma.parkingSlot.findFirst({
      where: { slotNumber: slotData.slotNumber },
    });
    
    if (existingSlot) {
      return res.status(400).json({ error: 'Parking slot with this number already exists' });
    }
    
    // Create slot
    const slot = await prisma.parkingSlot.create({
      data: slotData,
    });
    
    res.status(201).json({ slot });
  } catch (error) {
    next(error);
  }
};

export const updateParkingSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only admins can update parking slots
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update parking slots' });
    }
    
    const { id } = req.params;
    const slotData = updateSlotSchema.parse(req.body);
    
    // Verify slot exists
    const existingSlot = await prisma.parkingSlot.findUnique({
      where: { id },
    });
    
    if (!existingSlot) {
      return res.status(404).json({ error: 'Parking slot not found' });
    }
    
    // Check if slot number is changed and is unique
    if (slotData.slotNumber && slotData.slotNumber !== existingSlot.slotNumber) {
      const duplicateSlot = await prisma.parkingSlot.findFirst({
        where: { slotNumber: slotData.slotNumber },
      });
      
      if (duplicateSlot) {
        return res.status(400).json({ error: 'Parking slot with this number already exists' });
      }
    }
    
    // Update slot
    const slot = await prisma.parkingSlot.update({
      where: { id },
      data: slotData,
    });
    
    res.json({ slot });
  } catch (error) {
    next(error);
  }
};

export const deleteParkingSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only admins can delete parking slots
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can delete parking slots' });
    }
    
    const { id } = req.params;
    
    // Verify slot exists
    const existingSlot = await prisma.parkingSlot.findUnique({
      where: { id },
      include: {
        parkingSessions: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });
    
    if (!existingSlot) {
      return res.status(404).json({ error: 'Parking slot not found' });
    }
    
    // Check if slot has active parking sessions
    if (existingSlot.parkingSessions.length > 0) {
      return res.status(400).json({ error: 'Cannot delete slot with active parking sessions' });
    }
    
    // Delete slot
    await prisma.parkingSlot.delete({
      where: { id },
    });
    
    res.json({ message: 'Parking slot deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Seed 100 parking slots
export const seedParkingSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only admins can seed parking slots
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can seed parking slots' });
    }
    
    const count = await prisma.parkingSlot.count();
    
    if (count > 0) {
      return res.status(400).json({ error: 'Parking slots already exist' });
    }
    
    const slots = [];
    const vehicleTypes = ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS'];
    const sizes = ['SMALL', 'MEDIUM', 'LARGE'];
    const locations = ['Block A', 'Block B', 'Block C', 'Block D'];
    
    for (let i = 1; i <= 100; i++) {
      const slotNumber = `SLOT-${i.toString().padStart(3, '0')}`;
      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      
      // Get appropriate size based on vehicle type
      let size;
      switch (vehicleType) {
        case 'MOTORCYCLE':
          size = 'SMALL';
          break;
        case 'CAR':
        case 'VAN':
          size = 'MEDIUM';
          break;
        case 'TRUCK':
        case 'BUS':
          size = 'LARGE';
          break;
        default:
          size = sizes[Math.floor(Math.random() * sizes.length)];
      }
      
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      slots.push({
        slotNumber,
        location,
        vehicleType,
        size,
        status: 'AVAILABLE',
      });
    }
    
    await prisma.parkingSlot.createMany({
      data: slots,
    });
    
    res.json({ message: `${slots.length} parking slots created successfully` });
  } catch (error) {
    next(error);
  }
};
