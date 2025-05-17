const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Delete existing admin by email (unique field)
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'iratuzibeniegiramata@gmail.com' }
  });

  if (existingAdmin) {
    await prisma.user.delete({
      where: { id: existingAdmin.id }
    });
  }

  // Hash password
  const adminPassword = bcrypt.hashSync('Benie@123', 10);

  // Create admin user
  await prisma.user.create({
    data: {
      email: 'iratuzibeniegiramata@gmail.com',
      name: 'Benie',
      password: adminPassword,
      role: 'ADMIN',
      phoneNumber: '+250795192369',
      isVerified: true,
    }
  });

  console.log('Admin user seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });