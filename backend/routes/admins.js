const express = require('express');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const sendEmail = require('../utils/sendEmail');
const Notification = require('../models/Notification');

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
      const password = (req.body.password || '').trim();
      const normalizedEmail = (req.body.email || '').trim().toLowerCase();
      const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!password) {
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

router.put(
  '/:id/settings',
  [
    param('id').isMongoId().withMessage('Invalid administrator ID'),
    body('adminAlerts').isBoolean().withMessage('adminAlerts must be a boolean'),
    body('emailSummary').isBoolean().withMessage('emailSummary must be a boolean')
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { adminAlerts, emailSummary } = req.body;
      const admin = await Admin.findByIdAndUpdate(
        req.params.id,
        { $set: { adminAlerts, emailSummary } },
        { new: true, runValidators: true }
      );

      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found' });
      }

      // Send email notification
      try {
        const subject = 'Notification Settings Updated';
        const text = `Hi ${admin.firstName},\n\nYour notification settings have been updated.\n\nAdmin Alerts: ${admin.adminAlerts ? 'Enabled' : 'Disabled'}\nEmail Summary: ${admin.emailSummary ? 'Enabled' : 'Disabled'}\n\nIf you did not make this change, please contact support immediately.\n\nThanks,\nThe UMP Admin Team`;
        const html = `<p>Hi ${admin.firstName},</p><p>Your notification settings have been updated.</p><ul><li>Admin Alerts: <strong>${admin.adminAlerts ? 'Enabled' : 'Disabled'}</strong></li><li>Email Summary: <strong>${admin.emailSummary ? 'Enabled' : 'Disabled'}</strong></li></ul><p>If you did not make this change, please contact support immediately.</p><p>Thanks,<br>The UMP Admin Team</p>`;
        await sendEmail(admin.email, subject, text, html);
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Do not block the response for email failure
      }

      // Create in-app notification
      try {
        const notification = new Notification({
          title: 'Settings Updated',
          message: 'Your notification settings have been successfully updated.',
          type: 'settings-changed',
          recipient: admin._id,
        });
        await notification.save();
      } catch (notificationError) {
        console.error('Failed to create in-app notification:', notificationError);
      }

      res.json({ success: true, message: 'Notification settings updated successfully', data: admin });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ success: false, message: 'Failed to update notification settings' });
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

      const currentPassword = req.body.currentPassword?.trim() || '';
      const newPassword = req.body.newPassword?.trim() || '';

      const passwordMatches = await admin.comparePassword(currentPassword);
      if (!passwordMatches) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      if (!newPassword) {
        return res.status(400).json({ success: false, message: 'New password cannot be empty' });
      }

      admin.password = newPassword;
      await admin.save();

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating admin password:', error);
      res.status(500).json({ success: false, message: 'Failed to update password' });
    }
  }
);

router.post('/check-email', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
], handleValidation, async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail });
    res.json({ success: true, exists: Boolean(admin) });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify administrator email' });
  }
});

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
], handleValidation, async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Administrator not found' });
    }

    const resetToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });

    const frontendBase = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetURL = `${frontendBase}/reset-password/${resetToken}`;

    const textMessage = `Hi ${admin.firstName || 'there'},\n\nWe received a request to reset your UMP Admin Portal password.\n\nClick the link below to choose a new password (valid for 10 minutes):\n${resetURL}\n\nIf you did not request a password reset, you can safely ignore this email.\n\nRegards,\nUMP Admin Team`;
    const htmlMessage = `
      <p>Hi ${admin.firstName || 'there'},</p>
      <p>We received a request to reset your UMP Admin Portal password.</p>
      <p><a href="${resetURL}" style="color:#2563eb;font-weight:600;">Reset your password</a> (valid for 10 minutes).</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Regards,<br/>UMP Admin Team</p>
    `;

    try {
      await sendEmail(admin.email, 'UMP Admin Portal password reset', textMessage, htmlMessage);
      res.json({ success: true, message: 'Password reset instructions sent to your email' });
    } catch (err) {
      admin.passwordResetToken = undefined;
      admin.passwordResetExpires = undefined;
      await admin.save({ validateBeforeSave: false });
      console.error('Error sending password reset email:', err);
      res.status(500).json({ success: false, message: 'Unable to send password reset email. Please try again later.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process forgot password request' });
  }
});

router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must include a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character')
], handleValidation, async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const admin = await Admin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
    }

    const nextPassword = req.body.password?.trim() || '';
    if (!nextPassword) {
      return res.status(400).json({ success: false, message: 'Password cannot be empty' });
    }

    admin.password = nextPassword;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    const token = generateToken(admin._id);
    res.json({ success: true, message: 'Password reset successful', data: { token } });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

module.exports = router;
