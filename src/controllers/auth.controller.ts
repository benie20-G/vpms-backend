
require('dotenv').config();


import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
// import { Secret } from 'jsonwebtoken';
import jwt, { Secret } from 'jsonwebtoken';
// import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendEmail } from '../lib/email';
import crypto from 'crypto';




// const JWT_CONFIG = {
//   secret: process.env.JWT_SECRET as Secret,
//   expiresIn: process.env.JWT_EXPIRES_IN // Changed to "1d" (1 day) instead of 1000
// };
// Validation schemas
const JWT_SECRET = (process.env.JWT_SECRET || 'default_secret') as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as BigInt; // ✅ Must be string | number
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, "the password is too short")
    .regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
    .regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/^(?=.*\d)/, "Password must contain at least one number")
    .regex(/(?!.*--)/, "Password must not contain '--'")  //PREVENT SQL INJECTION
    .regex(/^[^<>]*$/, "Password must not contain '<' or '>'"), // PREVENT CROSS-SITE SCRIPTING
  name: z.string().min(2),
  phoneNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

export const register = async (req: Request,res: Response,next: NextFunction
) => {
  try {
    const { email, password, name, phoneNumber } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpires = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now
    
    // Create user with verification code
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        isVerified: false,
        verificationCode,
        verificationExpires,
        // First user is admin, rest are regular users
        role: (await prisma.user.count()) === 0 ? 'ADMIN' : 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        isVerified: true,
      },
    });
    
    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify your Park Zenith account',
      html: `
        <h1>Welcome to Park Zenith!</h1>
        <p>Hello ${name},</p>
        <p>Thank you for registering with Park Zenith. To complete your registration, please use the following verification code:</p>
        <h2 style="font-size: 24px; background-color: #f4f4f4; padding: 10px; text-align: center;">${verificationCode}</h2>
        <p>This code will expire in 6 hours.</p>
        <p>If you did not register for a Park Zenith account, please ignore this email.</p>
        <p>Best regards,<br>The Park Zenith Team</p>
      `,
    });
    
    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user,
      requiresVerification: true,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const { email, code } = verifyEmailSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    if (!user.verificationCode || !user.verificationExpires) {
      return res.status(400).json({ error: 'No verification code found' });
    }
    
    if (user.verificationExpires < new Date()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }
    
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Verify user
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        isVerified: true,
      },
    });

    // Generate JWT
   const token = jwt.sign(
  { userId: updatedUser.id },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN } 
);
    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome to Park Zenith!',
      html: `
        <h1>Welcome to Park Zenith!</h1>
        <p>Hello ${updatedUser.name},</p>
        <p>Your email has been verified successfully. You can now log in to your account and start using Park Zenith.</p>
        <p>Best regards,<br>The Park Zenith Team</p>
      `,
    });
    
    res.json({
      message: 'Email verified successfully',
      user: updatedUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationCode = async (req: Request,res: Response, next: NextFunction
) => {
  try {
    const { email } = req.body
  
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Generate new verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpires = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now
    
    // Update user with new verification code
    await prisma.user.update({
      where: { email },
      data: {
        verificationCode,
        verificationExpires,
      },
    });
    
    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Park Zenith - New Verification Code',
      html: `
        <h1>Park Zenith Verification</h1>
        <p>Hello ${user.name},</p>
        <p>You requested a new verification code. Please use the following code to verify your account:</p>
        <h2 style="font-size: 24px; background-color: #f4f4f4; padding: 10px; text-align: center;">${verificationCode}</h2>
        <p>This code will expire in 6 hours.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <p>Best regards,<br>The Park Zenith Team</p>
      `,
    });
    
    res.json({
      message: 'Verification code resent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      // For security reasons, don't tell the user that the email doesn't exist
      return res.json({
        message: 'If your email exists in our system, a reset code has been sent.',
      });
    }
    
    // Generate reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetExpires = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now
    
    // Update user with reset code
    await prisma.user.update({
      where: { email },
      data: {
        resetCode,
        resetExpires,
      },
    });
    
    // Send reset email
    await sendEmail({
      to: email,
      subject: 'Reset Your Park Zenith Password',
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Please use the following code to reset your password:</p>
        <h2 style="font-size: 24px; background-color: #f4f4f4; padding: 10px; text-align: center;">${resetCode}</h2>
        <p>This code will expire in 6 hours.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,<br>The Park Zenith Team</p>
      `,
    });
    
    res.json({
      message: 'If your email exists in our system, a reset code has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.resetCode || !user.resetExpires) {
      return res.status(400).json({ error: 'No reset code found' });
    }
    
    if (user.resetExpires < new Date()) {
      return res.status(400).json({ error: 'Reset code expired' });
    }
    
    if (user.resetCode !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password and clear reset code
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetExpires: null,
      },
    });
    
    // Send password changed email
    await sendEmail({
      to: email,
      subject: 'Your Park Zenith Password Has Been Reset',
      html: `
        <h1>Password Reset Successful</h1>
        <p>Hello ${user.name},</p>
        <p>Your password has been successfully reset. You can now log in with your new password.</p>
        <p>If you did not request this change, please contact support immediately.</p>
        <p>Best regards,<br>The Park Zenith Team</p>
      `,
    });
    
    res.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request,res: Response,
next: NextFunction
) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        requiresVerification: true,
        email: user.email
      });
    }
    
    // Generate JWT
   const token = jwt.sign(
  { userId: user.id },
  JWT_SECRET as Secret,
  { expiresIn: JWT_EXPIRES_IN }
);

    // Return user data without password
    const { password: _, ...userData } = user;

    res.json({
      message: 'Login successful',
      user: userData,
      token,
    });
  } catch (error) {
    next(error);
  }
};
