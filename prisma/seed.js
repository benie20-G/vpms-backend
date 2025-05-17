import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
const prisma = new PrismaClient()

async function main() {
    const existingadmin = await prisma.user.findUnique({
      where: { role: 'ADMIN '}})
  
      if(existingadmin){
        await prisma.user.delete({
          where: { id: existingadmin.id }
        })
      }
  // Hash passwords
  const adminPassword = bcrypt.hashSync('Benie@123', 10)

  // Create users
  const admin = await prisma.user.create({
    data:{
      email:'iratuzibeniegiramata@gmail.com',
      name:'Benie',
      password: adminPassword,
      role:'ADMIN',
      phoneNumber:'+250795192369',
      isVerified:true,

    }
  })
}
