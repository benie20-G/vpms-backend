const { z } = require('zod');
const { prisma } = require('../lib/prisma');

// Validation schemas
const createVehicleSchema = z.object({
  plateNumber: z.string(),
  size: z.string(),
 vehicleType: z.string(),
  color: z.string(),
});

const updateVehicleSchema = z.object({
  plateNumber: z.string().optional(),
  size: z.string().optional(),
 vehicleType: z.string().optional(),
  color: z.string().optional(),
});

const getAllVehicles = async (req, res, next) => {
  try {
    // Admins can see all vehicles, users can only see their own
    const vehicles = req.user?.role === 'ADMIN'
      ? await prisma.vehicle.findMany({
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
        })
      : await prisma.vehicle.findMany({
          where: {
            ownerId: req.user?.id,
          },
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
        });
    
    const transformedVehicles = vehicles.map((vehicle) => ({
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      size: vehicle.size,
     vehicleType: vehicle.VehicleType,
      color: vehicle.color,
      ownerId: vehicle.ownerId,
      ownerName: vehicle.owner?.name || '',
      ownerEmail: vehicle.owner?.email || '',
      ownerPhone: vehicle.owner?.phoneNumber || '',
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    }));
    
    res.json(transformedVehicles);
  } catch (error) {
    next(error);
  }
};

const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
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
    });
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Check if user has permission to view this vehicle
    if (req.user?.role !== 'ADMIN' && vehicle.ownerId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Transform data to match frontend expectations
    const transformedVehicle = {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      size: vehicle.size,
     vehicleType: vehicle.VehicleType,
      color: vehicle.color,
      ownerId: vehicle.ownerId,
      ownerName: vehicle.owner?.name || '',
      ownerEmail: vehicle.owner?.email || '',
      ownerPhone: vehicle.owner?.phoneNumber || '',
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
    
    res.json(transformedVehicle);
  } catch (error) {
    next(error);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const vehicleData = createVehicleSchema.parse(req.body);
    
    // Get user information for vehicle owner details
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phoneNumber: true },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if plate number already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber: vehicleData.plateNumber },
    });
    
    if (existingVehicle) {
      return res.status(400).json({ error: 'Vehicle with this plate number already exists' });
    }
    
    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        ...vehicleData,
        ownerId: req.user.id,
      },
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
    });
    
    // Transform data to match frontend expectations
    const transformedVehicle = {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      size: vehicle.size,
     vehicleType: vehicle.VehicleType,
      color: vehicle.color,
      ownerId: vehicle.ownerId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
    
    res.status(201).json(transformedVehicle);
  } catch (error) {
    next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicleData = updateVehicleSchema.parse(req.body);
    
    // Check if vehicle exists and user has permission to update it
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });
    
    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Only the owner or admin can update the vehicle
    if (req.user?.role !== 'ADMIN' && existingVehicle.ownerId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // If plate number is being updated, check if it's already in use
    if (vehicleData.plateNumber && vehicleData.plateNumber !== existingVehicle.plateNumber) {
      const duplicatePlate = await prisma.vehicle.findUnique({
        where: { plateNumber: vehicleData.plateNumber },
      });
      
      if (duplicatePlate) {
        return res.status(400).json({ error: 'Vehicle with this plate number already exists' });
      }
    }
    
    // Update vehicle
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: vehicleData,
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
    });
    
    // Transform data to match frontend expectations
    const transformedVehicle = {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      size: vehicle.size,
     vehicleType: vehicle.VehicleType,
      color: vehicle.color,
      ownerId: vehicle.ownerId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
    
    res.json(transformedVehicle);
  } catch (error) {
    next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if vehicle exists and user has permission to delete it
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Only the owner or admin can delete the vehicle
    if (req.user?.role !== 'ADMIN' && vehicle.ownerId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Delete vehicle
    await prisma.vehicle.delete({
      where: { id },
    });
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};