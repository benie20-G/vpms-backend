const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'iratuzibeniegiramata@gmail.com',
      pass: 'pwrn qsbq kkfc zvea'
    }
  });
  const info = await transporter.sendMail({
    from: '"NePark" <iratuzibeniegiramata@gmail.com>',
    to, subject, html
  });
  console.log(`Email sent: ${info.messageId}`);
  return info;
};

const getEmailTemplate = (templateName, replacements) => {
  try {
    let template = fs.readFileSync(path.join(__dirname, '../templates', `${templateName}.html`), 'utf-8');
    Object.entries(replacements).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return template;
  } catch (error) {
    console.error(`Error reading template ${templateName}:`, error);
    return `<p>Error: Could not load email template. Please contact support.</p>`;
  }
};

const sendVerificationEmail = (email, name, verificationCode) => 
  sendEmail({
    to: email,
    subject: 'Verify your Park Zenith account',
    html: getEmailTemplate('verification-email', { name, verificationCode })
  });

const sendWelcomeEmail = (email, name) => 
  sendEmail({
    to: email,
    subject: 'Welcome to Park Zenith!',
    html: getEmailTemplate('welcome-email', { name })
  });

const sendPasswordResetEmail = (email, name, resetCode) => 
  sendEmail({
    to: email,
    subject: 'Reset Your Park Zenith Password',
    html: getEmailTemplate('reset-password-email', { name, resetCode })
  });

const sendPasswordChangedEmail = (email, name) => 
  sendEmail({
    to: email,
    subject: 'Your Park Zenith Password Has Been Changed',
    html: getEmailTemplate('password-changed-email', { name })
  });

const sendParkingPaymentEmail = (email, name, details) => 
  sendEmail({
    to: email,
    subject: 'Park Zenith Parking Payment Receipt',
    html: getEmailTemplate('parking-payment-email', { name, ...details })
  });

module.exports = {
  sendEmail,
  getEmailTemplate,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendParkingPaymentEmail
};