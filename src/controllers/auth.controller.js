
require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { sendEmail, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../lib/email');
const crypto = require('crypto');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// Validation schemas
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

const register = async (req, res, next) => {
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
    await sendVerificationEmail(email,name, verificationCode);
    
    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user,
      requiresVerification: true,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
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
    await sendWelcomeEmail(updatedUser.email, updatedUser.name);
    
    res.json({
      message: 'Email verified successfully',
      user: updatedUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
  
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
    await sendVerificationEmail(email, verificationCode, user.name);
    
    res.json({
      message: 'Verification code resent successfully',
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
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
    await sendPasswordResetEmail(email, resetCode, user.name);
    
    res.json({
      message: 'If your email exists in our system, a reset code has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
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
    await sendEmail(email, 'Password Changed', 'Your password has been changed successfully you can now login http://10.12.75.147/api/auth/login ');
    
    res.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
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
      JWT_SECRET,
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

module.exports = {
  register,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  login,
};