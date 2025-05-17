
import { PrismaClient } from '@prisma/client';

/**
 * Prisma client instance for database operations
 * @type
 */
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

/**
 * Initializes the database connection
 * @returns 
 */
export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}
