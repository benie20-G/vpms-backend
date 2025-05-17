
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';


/**
 * Sends an email using the configured transporter
 * @param options - Email options including recipient, subject, and HTML content
 * @returns The info object from the mail transport
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'iratuzibeniegiramata@gmail.com',
        pass: 'pwrn qsbq kkfc zvea'
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: '"NePark" <iratuzibeniegiramata@gmail.com>',
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Reads an email template from the templates directory and replaces placeholders
 * @param templateName - The name of the template file without extension
 * @param replacements - Object containing key-value pairs for replacements
 * @returns The HTML content with replacements applied
 */
export const getEmailTemplate = (
  templateName,
  replacements
)=> {
  try {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace all placeholders with their values
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value);
    });
    
    return template;
  } catch (error) {
    console.error(`Error reading template ${templateName}:`, error);
    return `<p>Error: Could not load email template. Please contact support.</p>`;
  }
};

/**
 * Sends a verification email to a new user
 * @param email - User's email address
 * @param name - User's name
 * @param verificationCode - The verification code
 */
export const sendVerificationEmail = async (
  email,
  name,
  verificationCode
) => {
  const html = getEmailTemplate('verification-email', {
    name,
    verificationCode
  });
  
  return sendEmail({
    to: email,
    subject: 'Verify your Park Zenith account',
    html
  });
};

/**
 * Sends a welcome email to a user after verification
 * @param email - User's email address
 * @param name - User's name
 */
export const sendWelcomeEmail = async (
  email, 
  name
) => {
  const html = getEmailTemplate('welcome-email', {
    name
  });
  
  return sendEmail({
    to: email,
    subject: 'Welcome to Park Zenith!',
    html
  });
};

/**
 * Sends a password reset email
 * @param email - User's email address
 * @param name - User's name
 * @param resetCode - The password reset code
 */
export const sendPasswordResetEmail = async (
  email, 
  name, 
  resetCode
) => {
  const html = getEmailTemplate('reset-password-email', {
    name,
    resetCode
  });
  
  return sendEmail({
    to: email,
    subject: 'Reset Your Park Zenith Password',
    html
  });
};

/**
 * Sends a confirmation email after password has been changed
 * @param email - User's email address
 * @param name - User's name
 */
export const sendPasswordChangedEmail = async (
  email, 
  name
) => {
  const html = getEmailTemplate('password-changed-email', {
    name
  });
  
  return sendEmail({
    to: email,
    subject: 'Your Park Zenith Password Has Been Changed',
    html
  });
};

/**
 * Sends a payment receipt email for parking
 * @param email - User's email address
 * @param name - User's name
 * @param details - Parking session details
 */
export const sendParkingPaymentEmail = async (
  email,
  name,
  details
) => {
  const html = getEmailTemplate('parking-payment-email', {
    name,
    ...details
  });
  
  return sendEmail({
    to: email,
    subject: 'Park Zenith Parking Payment Receipt',
    html
  });
};
