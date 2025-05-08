const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create a test transporter for development
let transporter;

// Setup transporter based on environment
if (process.env.NODE_ENV === 'production') {
  // Use real email service in production
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Use ethereal.email (fake SMTP service) for development/testing
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'ethereal.user@ethereal.email', // Replace with actual ethereal credentials if needed
      pass: 'ethereal.password'
    }
  });
}

// Send verification email
exports.sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/verify/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@chat-api.com',
      to: email,
      subject: 'Email Verification',
      html: `
        <h1>Verify Your Email</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you did not request this verification, please ignore this email.</p>
      `
    };

    if (process.env.NODE_ENV === 'development') {
      // In development, log the verification URL instead of sending the email
      logger.info(`Verification URL: ${verificationUrl}`);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@chat-api.com',
      to: email,
      subject: 'Password Reset',
      html: `
        <h1>Reset Your Password</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request a password reset, please ignore this email or contact support.</p>
        <p>This link will expire in 1 hour.</p>
      `
    };

    if (process.env.NODE_ENV === 'development') {
      // In development, log the reset URL instead of sending the email
      logger.info(`Password reset URL: ${resetUrl}`);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};