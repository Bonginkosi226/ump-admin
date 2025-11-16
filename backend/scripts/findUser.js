require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const findUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await Admin.findOne({ email });
    if (admin) {
      console.log(`Found admin: ${admin.firstName} ${admin.lastName} (${admin.email})`);
    } else {
      console.log(`Admin with email ${email} not found.`);
    }
  } catch (error) {
    console.error('Error connecting to database or finding user:', error);
  } finally {
    mongoose.connection.close();
  }
};

const emailToFind = process.argv[2];
if (!emailToFind) {
  console.log('Please provide an email address to find.');
  process.exit(1);
}

findUser(emailToFind);
