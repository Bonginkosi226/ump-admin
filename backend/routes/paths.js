const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Path = require('../models/Path');
const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules
const pathValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Path name must be between 1 and 100 characters'),
  body('type')
    .isIn(['walking', 'cycling', 'vehicle', 'emergency', 'accessible', 'shuttle'])
    .withMessage('Invalid path type'),
  body('coordinates')
    .isArray({ min: 2 })
    .withMessage('Path must have at least 2 coordinate points'),
  body('coordinates.*.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('coordinates.*.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('startPoint.name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Start point name is required'),
  body('startPoint.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Start point latitude must be between -90 and 90'),
  body('startPoint.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Start point longitude must be between -180 and 180'),
  body('endPoint.name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('End point name is required'),
  body('endPoint.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('End point latitude must be between -90 and 90'),
  body('endPoint.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('End point longitude must be between -180 and 180'),
  body('campus')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Campus is required'),
  body('createdBy')
    .isMongoId()
    .withMessage('Valid creator ID is required')
];

const updatePathValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Path name must be between 1 and 100 characters'),
  body('type')
    .optional()
    .isIn(['walking', 'cycling', 'vehicle', 'emergency', 'accessible', 'shuttle'])
    .withMessage('Invalid path type'),
  body('coordinates')
    .optional()
    .isArray({ min: 2 })
    .withMessage('Path must have at least 2 coordinate points'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'under_construction', 'closed', 'maintenance'])
    .withMessage('Invalid status')
];

// GET /api/paths - Get all paths with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('campus').optional().trim(),
  query('type').optional().isIn(['walking', 'cycling', 'vehicle', 'emergency', 'accessible', 'shuttle']),
  query('status').optional().isIn(['active', 'inactive', 'under_construction', 'closed', 'maintenance']),
  query('search').optional().trim(),
  query('accessible').optional().isBoolean().withMessage('Accessible must be a boolean')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      campus,
      type,
      status = 'active',
      search,
      accessible,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    if (campus) query.campus = campus;
    if (type) query.type = type;
    if (status) query.status = status;
    if (accessible === 'true') query['accessibility.wheelchairAccessible'] = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'startPoint.name': { $regex: search, $options: 'i' } },
        { 'endPoint.name': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paths = await Path.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName')
      .populate('startPoint.buildingId', 'name code')
      .populate('endPoint.buildingId', 'name code')
      .lean();

    // Get total count for pagination
    const total = await Path.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: paths,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching paths:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching paths',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/paths/stats - Get path statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Path.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          },
          byCampus: {
            $push: {
              campus: '$campus',
              count: 1
            }
          },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          },
          accessiblePaths: {
            $sum: {
              $cond: ['$accessibility.wheelchairAccessible', 1, 0]
            }
          },
          totalDistance: { $sum: '$distance' },
          averagePopularity: { $avg: '$usage.popularity' }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      byType: {},
      byCampus: {},
      byStatus: {},
      accessiblePaths: 0,
      totalDistance: 0,
      averagePopularity: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching path stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching path statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/paths/nearby - Find paths near a location
router.get('/nearby/:lat/:lng', [
  param('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  param('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { radius = 1000, limit = 10, campus } = req.query;

    const paths = await Path.findNearLocation(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius),
      campus
    ).limit(parseInt(limit));

    res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    console.error('Error finding nearby paths:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding nearby paths',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/paths/accessible - Find accessible paths
router.get('/accessible', [
  query('campus').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const { campus, limit = 20 } = req.query;

    const paths = await Path.findAccessible(campus).limit(parseInt(limit));

    res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    console.error('Error finding accessible paths:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding accessible paths',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/paths/popular - Find popular paths
router.get('/popular', [
  query('campus').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], handleValidationErrors, async (req, res) => {
  try {
    const { campus, limit = 10 } = req.query;

    const paths = await Path.findPopular(parseInt(limit), campus);

    res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    console.error('Error finding popular paths:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding popular paths',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/paths/types/:type - Get paths by type
router.get('/types/:type', [
  param('type').isIn(['walking', 'cycling', 'vehicle', 'emergency', 'accessible', 'shuttle']).withMessage('Invalid path type'),
  query('campus').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { type } = req.params;
    const { campus } = req.query;

    const paths = await Path.findByType(type, campus);

    res.json({
      success: true,
      data: paths
    });
  } catch (error) {
    console.error('Error fetching paths by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching paths by type',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/paths/:id - Get a specific path
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid path ID')
], handleValidationErrors, async (req, res) => {
  try {
    const path = await Path.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email')
      .populate('startPoint.buildingId', 'name code type')
      .populate('endPoint.buildingId', 'name code type')
      .populate('images.uploadedBy', 'firstName lastName');
    
    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Path not found'
      });
    }

    res.json({
      success: true,
      data: path
    });
  } catch (error) {
    console.error('Error fetching path:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching path',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/paths - Create a new path
router.post('/', pathValidation, handleValidationErrors, async (req, res) => {
  try {
    const path = new Path(req.body);
    await path.save();

    // Populate the created path
    await path.populate('createdBy', 'firstName lastName');
    await path.populate('startPoint.buildingId', 'name code');
    await path.populate('endPoint.buildingId', 'name code');

    res.status(201).json({
      success: true,
      message: 'Path created successfully',
      data: path
    });
  } catch (error) {
    console.error('Error creating path:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating path',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/paths/:id - Update a path
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid path ID'),
  ...updatePathValidation
], handleValidationErrors, async (req, res) => {
  try {
    // Add lastModifiedBy if provided in request (should come from auth middleware)
    if (req.body.lastModifiedBy) {
      req.body.lastModifiedBy = req.body.lastModifiedBy;
    }

    const path = await Path.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName')
    .populate('lastModifiedBy', 'firstName lastName')
    .populate('startPoint.buildingId', 'name code')
    .populate('endPoint.buildingId', 'name code');

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Path not found'
      });
    }

    res.json({
      success: true,
      message: 'Path updated successfully',
      data: path
    });
  } catch (error) {
    console.error('Error updating path:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating path',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/paths/:id - Delete a path
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid path ID')
], handleValidationErrors, async (req, res) => {
  try {
    const path = await Path.findByIdAndDelete(req.params.id);

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Path not found'
      });
    }

    res.json({
      success: true,
      message: 'Path deleted successfully',
      data: path
    });
  } catch (error) {
    console.error('Error deleting path:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting path',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/paths/:id/images - Add image to path
router.post('/:id/images', [
  param('id').isMongoId().withMessage('Invalid path ID'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { url, caption, uploadedBy } = req.body;
    
    const path = await Path.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          images: {
            url,
            caption,
            uploadedBy,
            uploadedAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('images.uploadedBy', 'firstName lastName');

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Path not found'
      });
    }

    res.json({
      success: true,
      message: 'Image added successfully',
      data: path
    });
  } catch (error) {
    console.error('Error adding image to path:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding image to path',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/paths/:id/usage - Update path usage statistics
router.put('/:id/usage', [
  param('id').isMongoId().withMessage('Invalid path ID'),
  body('popularity').optional().isFloat({ min: 0, max: 10 }).withMessage('Popularity must be between 0 and 10'),
  body('averageUsers.daily').optional().isInt({ min: 0 }).withMessage('Daily users must be a non-negative integer'),
  body('averageUsers.weekly').optional().isInt({ min: 0 }).withMessage('Weekly users must be a non-negative integer'),
  body('averageUsers.monthly').optional().isInt({ min: 0 }).withMessage('Monthly users must be a non-negative integer')
], handleValidationErrors, async (req, res) => {
  try {
    const updateData = {};
    if (req.body.popularity !== undefined) updateData['usage.popularity'] = req.body.popularity;
    if (req.body.averageUsers) {
      if (req.body.averageUsers.daily !== undefined) updateData['usage.averageUsers.daily'] = req.body.averageUsers.daily;
      if (req.body.averageUsers.weekly !== undefined) updateData['usage.averageUsers.weekly'] = req.body.averageUsers.weekly;
      if (req.body.averageUsers.monthly !== undefined) updateData['usage.averageUsers.monthly'] = req.body.averageUsers.monthly;
    }

    const path = await Path.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Path not found'
      });
    }

    res.json({
      success: true,
      message: 'Path usage updated successfully',
      data: path
    });
  } catch (error) {
    console.error('Error updating path usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating path usage',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;