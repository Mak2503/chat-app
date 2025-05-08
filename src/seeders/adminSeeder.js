require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

// Default admin user details
const defaultAdmin = {
  name: 'Admin',
  firstName: 'System',
  email: 'admin@example.com',
  country: 'Global',
  password: 'Admin@123',
  role: 'admin',
  isVerified: true
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      logger.info('Connected to MongoDB');

      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: defaultAdmin.email });
      if (existingAdmin) {
        logger.info('Default admin already exists');
        mongoose.disconnect();
        return;
      }

      // Create default admin user
      const admin = new User(defaultAdmin);
      await admin.save();

      logger.info('Default admin user created successfully');
      logger.info(`Email: ${defaultAdmin.email}`);
      logger.info(`Password: ${defaultAdmin.password}`);
      logger.info('Please change this password after first login');

      mongoose.disconnect();
    } catch (error) {
      logger.error('Error creating admin user:', error);
      mongoose.disconnect();
      process.exit(1);
    }
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });