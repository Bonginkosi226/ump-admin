const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Hardcoded admin accounts to migrate
const ADMIN_ACCOUNTS = [
  {
    email: 'admin1@ump.ac.za',
    password: 'UMP@Admin2024!',
    firstName: 'System',
    lastName: 'Administrator',
    phone: '+27111234567',
    department: 'IT Administration',
    role: 'admin',
    status: 'active',
    emailVerified: true
  },
  {
    email: 'admin2@ump.ac.za',
    password: 'UMP@Admin2024#',
    firstName: 'Campus',
    lastName: 'Administrator',
    phone: '+27111234568',
    department: 'Campus Management',
    role: 'admin',
    status: 'active',
    emailVerified: true
  }
];

async function migrateAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ump-admin');
    console.log('Connected to MongoDB');

    // Check if admin users already exist
    for (const adminData of ADMIN_ACCOUNTS) {
      const existingUser = await User.findOne({ email: adminData.email });
      
      if (existingUser) {
        console.log(`Admin user ${adminData.email} already exists, skipping...`);
        continue;
      }

      // Create new admin user
      const adminUser = new User({
        ...adminData,
        permissions: {
          buildings: { read: true, write: true, delete: true },
          users: { read: true, write: true, delete: true },
          dashboard: { read: true, analytics: true },
          paths: { read: true, write: true, delete: true }
        }
      });

      await adminUser.save();
      console.log(`Successfully created admin user: ${adminData.email}`);
    }

    console.log('Admin migration completed successfully!');
  } catch (error) {
    console.error('Error during admin migration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateAdmins();
}

module.exports = migrateAdmins;