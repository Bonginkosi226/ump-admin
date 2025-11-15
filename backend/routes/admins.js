const express = require('express');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const baseFields = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .matches(/^[+]?([0-9][\s-]?){6,20}$/)
    .withMessage('Enter a valid phone number'),
  body('department')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),
];

const generateToken = (adminId) =>
  jwt.sign({ adminId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

router.post(
  '/register',
  [
    ...baseFields,
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
      .matches(/[0-9]/).withMessage('Password must include a number')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Password must include a special character')
  ],
  handleValidation,
  async (req, res) => {
    try {
      const existing = await Admin.findOne({ email: req.body.email.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An administrator with that email already exists'
        });
      }

      const admin = await Admin.create(req.body);
      const token = generateToken(admin._id);

      res.status(201).json({
        success: true,
        message: 'Administrator registered successfully',
        data: { admin, token }
      });
    } catch (error) {
      console.error('Error registering admin:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'An administrator with that email already exists'
        });
      }

      if (error.name === 'ValidationError') {
        const details = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: details.join(' ')
        });
      }

      if (typeof error.message === 'string' && error.message.includes('ECONNREFUSED')) {
        return res.status(503).json({
          success: false,
          message: 'Database connection refused. Please verify your MongoDB URI and network connectivity.'
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to register administrator'
      });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await Admin.findOne({ email }).select('+password');

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const passwordMatches = await admin.comparePassword(password);
      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      admin.lastLogin = new Date();
      await admin.save();

      const token = generateToken(admin._id);
      const sanitizedAdmin = await Admin.findById(admin._id);

      res.json({
        success: true,
        message: 'Login successful',
        data: { admin: sanitizedAdmin, token }
      });
    } catch (error) {
      console.error('Error logging in admin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login administrator'
      });
    }
  }
);

router.get('/', async (_req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch administrators' });
  }
});

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid administrator ID')],
  handleValidation,
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found' });
      }
      res.json({ success: true, data: admin });
    } catch (error) {
      console.error('Error fetching admin:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch administrator' });
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid administrator ID'),
    ...baseFields.map((rule) => rule.optional({ nullable: true }))
  ],
  handleValidation,
  async (req, res) => {
    try {
      const updates = { ...req.body };
      delete updates.email; // prevent email changes via this endpoint

      const admin = await Admin.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found' });
      }

      res.json({ success: true, message: 'Administrator updated successfully', data: admin });
    } catch (error) {
      console.error('Error updating admin:', error);
      res.status(500).json({ success: false, message: 'Failed to update administrator' });
    }
  }
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid administrator ID')],
  handleValidation,
  async (req, res) => {
    try {
      const admin = await Admin.findByIdAndDelete(req.params.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found' });
      }
      res.json({ success: true, message: 'Administrator removed successfully' });
    } catch (error) {
      console.error('Error deleting admin:', error);
      res.status(500).json({ success: false, message: 'Failed to delete administrator' });
    }
  }
);

router.put(
  '/:id/password',
  [
    param('id').isMongoId().withMessage('Invalid administrator ID'),
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
      .matches(/[0-9]/).withMessage('Password must include a number')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character')
  ],
  handleValidation,
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id).select('+password');
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found' });
      }

      const passwordMatches = await admin.comparePassword(req.body.currentPassword);
      if (!passwordMatches) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      admin.password = req.body.newPassword;
      await admin.save();

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating admin password:', error);
      res.status(500).json({ success: false, message: 'Failed to update password' });
    }
  }
);

module.exports = router;
