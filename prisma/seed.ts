import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
const prisma = new PrismaClient()

async function main() {
  // Optional: Clear previous data for a clean seed
  await prisma.notification.deleteMany()
  await prisma.parkingSession.deleteMany()
  await prisma.slotRequest.deleteMany()
  await prisma.parkingSlot.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const adminPassword = bcrypt.hashSync('Admin@123', 10)
  const userPassword = bcrypt.hashSync('User@123', 10)

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phoneNumber: '1234567890',
      isVerified: true,
    },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      password: userPassword,
      name: 'John Doe',
      role: 'USER',
      phoneNumber: '0987654321',
      isVerified: true,
    },
  })

  // Create vehicles for user1
  const vehicle1 = await prisma.vehicle.create({
    data: {
      plateNumber: 'ABC123',
      vehicleType: 'CAR',
      size: 'MEDIUM',
      color: 'Red',
      ownerId: user1.id,
    },
  })

  const vehicle2 = await prisma.vehicle.create({
    data: {
      plateNumber: 'XYZ789',
      vehicleType: 'MOTORCYCLE',
      size: 'SMALL',
      color: 'Black',
      ownerId: user1.id,
    },
  })

  // Create parking slots
  const slot1 = await prisma.parkingSlot.create({
    data: {
      slotNumber: 'SLOT-001',
      location: 'Lot A',
      size: 'MEDIUM',
      vehicleType: 'CAR',
      status: 'AVAILABLE',
    },
  })

  const slot2 = await prisma.parkingSlot.create({
    data: {
      slotNumber: 'SLOT-002',
      location: 'Lot B',
      size: 'SMALL',
      vehicleType: 'MOTORCYCLE',
      status: 'AVAILABLE',
    },
  })

  // Create slot requests
  const slotRequest1 = await prisma.slotRequest.create({
    data: {
      userId: user1.id,
      vehicleId: vehicle1.id,
      slotId: slot1.id,
      status: 'APPROVED',
      responseTime: new Date(),
      responseNote: 'Approved for parking',
    },
  })

  // Create parking session
  await prisma.parkingSession.create({
    data: {
      vehicleId: vehicle1.id,
      slotId: slot1.id,
      requestId: slotRequest1.id,
      entryTime: new Date(),
      status: 'ACTIVE',
    },
  })

  // Create notification
  await prisma.notification.create({
    data: {
      userId: user1.id,
      message: 'Your parking request has been approved.',
      read: false,
    },
  })

  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })