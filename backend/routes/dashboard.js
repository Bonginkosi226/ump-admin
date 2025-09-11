const express = require('express');
const { query, validationResult } = require('express-validator');
const Building = require('../models/Building');
const User = require('../models/User');
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

// GET /api/dashboard/overview - Get dashboard overview statistics
router.get('/overview', [
  query('campus').optional().trim(),
  query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res) => {
  try {
    const { campus, timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const timeRanges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    const startDate = new Date(now.getTime() - timeRanges[timeRange]);

    // Build base queries
    const buildingQuery = campus ? { 'location.campus': campus, status: { $in: ['active', 'Active'] } } : { status: { $in: ['active', 'Active'] } };
    const pathQuery = campus ? { campus, status: { $in: ['active', 'Active'] } } : { status: { $in: ['active', 'Active'] } };
    const userQuery = { status: { $in: ['active', 'Active'] } };

    // Get basic counts
    const [totalBuildings, totalUsers, totalPaths] = await Promise.all([
      Building.countDocuments(buildingQuery),
      User.countDocuments(userQuery),
      Path.countDocuments(pathQuery)
    ]);

    // Get recent activity counts
    const [recentBuildings, recentUsers, recentPaths] = await Promise.all([
      Building.countDocuments({ ...buildingQuery, createdAt: { $gte: startDate } }),
      User.countDocuments({ ...userQuery, createdAt: { $gte: startDate } }),
      Path.countDocuments({ ...pathQuery, createdAt: { $gte: startDate } })
    ]);

    // Get building statistics by type
    const buildingsByType = await Building.aggregate([
      { $match: buildingQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get user statistics by role
    const usersByRole = await User.aggregate([
      { $match: userQuery },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get path statistics by type
    const pathsByType = await Path.aggregate([
      { $match: pathQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          avgPopularity: { $avg: '$usage.popularity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get campus statistics if no specific campus is requested
    let campusStats = [];
    if (!campus) {
      campusStats = await Building.aggregate([
        { $match: { status: { $in: ['active', 'Active'] } } },
        {
          $group: {
            _id: '$location.campus',
            buildingCount: { $sum: 1 },
            buildingTypes: { $addToSet: '$type' }
          }
        },
        {
          $lookup: {
            from: 'paths',
            localField: '_id',
            foreignField: 'campus',
            as: 'paths'
          }
        },
        {
          $project: {
            campus: '$_id',
            buildingCount: 1,
            buildingTypes: 1,
            pathCount: { $size: '$paths' },
            totalPathDistance: {
              $sum: '$paths.distance'
            }
          }
        },
        { $sort: { buildingCount: -1 } }
      ]);
    }

    // Get popular paths
    const popularPaths = await Path.find(pathQuery)
      .sort({ 'usage.popularity': -1 })
      .limit(5)
      .select('name type usage.popularity distance campus')
      .lean();

    // Get recent activity
    const recentActivity = await Promise.all([
      Building.find({ ...buildingQuery, createdAt: { $gte: startDate } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name type createdAt location.campus')
        .lean()
        .then(buildings => buildings.map(b => ({ ...b, activityType: 'building_created' }))),
      
      Path.find({ ...pathQuery, createdAt: { $gte: startDate } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name type createdAt campus')
        .populate('createdBy', 'firstName lastName')
        .lean()
        .then(paths => paths.map(p => ({ ...p, activityType: 'path_created' }))),
      
      User.find({ ...userQuery, createdAt: { $gte: startDate } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName role createdAt')
        .lean()
        .then(users => users.map(u => ({ ...u, activityType: 'user_registered' })))
    ]);

    // Combine and sort recent activity
    const allActivity = [...recentActivity[0], ...recentActivity[1], ...recentActivity[2]]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // Calculate growth percentages (simplified - comparing with previous period)
    const previousStartDate = new Date(startDate.getTime() - timeRanges[timeRange]);
    const [prevBuildings, prevUsers, prevPaths] = await Promise.all([
      Building.countDocuments({ ...buildingQuery, createdAt: { $gte: previousStartDate, $lt: startDate } }),
      User.countDocuments({ ...userQuery, createdAt: { $gte: previousStartDate, $lt: startDate } }),
      Path.countDocuments({ ...pathQuery, createdAt: { $gte: previousStartDate, $lt: startDate } })
    ]);

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const overview = {
      totals: {
        buildings: totalBuildings,
        users: totalUsers,
        paths: totalPaths,
        campuses: campus ? 1 : campusStats.length
      },
      recent: {
        buildings: recentBuildings,
        users: recentUsers,
        paths: recentPaths,
        timeRange
      },
      growth: {
        buildings: calculateGrowth(recentBuildings, prevBuildings),
        users: calculateGrowth(recentUsers, prevUsers),
        paths: calculateGrowth(recentPaths, prevPaths)
      },
      breakdown: {
        buildingsByType: buildingsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        pathsByType: pathsByType.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalDistance: item.totalDistance || 0,
            avgPopularity: Math.round((item.avgPopularity || 0) * 10) / 10
          };
          return acc;
        }, {})
      },
      campusStats: campusStats.map(stat => ({
        campus: stat.campus,
        buildings: stat.buildingCount,
        paths: stat.pathCount,
        totalDistance: stat.totalPathDistance || 0,
        buildingTypes: stat.buildingTypes.length
      })),
      popularPaths: popularPaths.map(path => ({
        id: path._id,
        name: path.name,
        type: path.type,
        popularity: path.usage?.popularity || 0,
        distance: path.distance || 0,
        campus: path.campus
      })),
      recentActivity: allActivity.map(activity => ({
        id: activity._id,
        type: activity.activityType,
        name: activity.name || `${activity.firstName} ${activity.lastName}`,
        details: activity.type || activity.role,
        campus: activity.campus || activity.location?.campus,
        createdAt: activity.createdAt,
        createdBy: activity.createdBy
      }))
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    
    // Check if it's a database connection error
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out') || error.name === 'MongoNetworkError') {
      // Return fallback data when database is unavailable
      const fallbackOverview = {
        totalBuildings: 15,
        totalUsers: 250,
        totalPaths: 45,
        recentBuildings: 3,
        recentUsers: 12,
        recentPaths: 5,
        buildingsByType: [
          { _id: 'academic', count: 8 },
          { _id: 'administrative', count: 4 },
          { _id: 'recreational', count: 3 }
        ],
        usersByRole: [
          { _id: 'student', count: 180 },
          { _id: 'staff', count: 50 },
          { _id: 'admin', count: 20 }
        ],
        pathsByType: [
          { _id: 'walking', count: 25 },
          { _id: 'cycling', count: 15 },
          { _id: 'vehicle', count: 5 }
        ],
        userGrowth: [
          { year: 2023, month: 1, users: 200 },
          { year: 2023, month: 2, users: 220 },
          { year: 2023, month: 3, users: 250 }
        ],
        popularPaths: [
          { id: '1', name: 'Main Campus Walk', type: 'walking', popularity: 95 },
          { id: '2', name: 'Library Route', type: 'walking', popularity: 88 }
        ],
        recentActivity: [
          { id: '1', type: 'building', name: 'New Library Wing', details: 'academic', createdAt: new Date() },
          { id: '2', type: 'user', name: 'John Doe', details: 'student', createdAt: new Date() }
        ]
      };
      
      return res.json({
        success: true,
        data: fallbackOverview,
        fallback: true,
        message: 'Using offline data - database unavailable'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/dashboard/analytics - Get detailed analytics
router.get('/analytics', [
  query('campus').optional().trim(),
  query('metric').optional().isIn(['buildings', 'users', 'paths', 'usage']).withMessage('Invalid metric'),
  query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid period')
], handleValidationErrors, async (req, res) => {
  try {
    const { campus, metric = 'buildings', period = 'monthly' } = req.query;
    
    // Calculate date grouping based on period
    const getDateGrouping = (period) => {
      switch (period) {
        case 'daily':
          return {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
        case 'weekly':
          return {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          };
        case 'monthly':
        default:
          return {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          };
      }
    };

    const dateGrouping = getDateGrouping(period);
    const last12Periods = new Date();
    last12Periods.setMonth(last12Periods.getMonth() - 12);

    let analytics = {};

    if (metric === 'buildings' || metric === 'all') {
      const buildingQuery = campus ? { 'location.campus': campus } : {};
      
      const buildingAnalytics = await Building.aggregate([
        { $match: { ...buildingQuery, createdAt: { $gte: last12Periods } } },
        {
          $group: {
            _id: dateGrouping,
            count: { $sum: 1 },
            types: { $addToSet: '$type' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
      ]);

      analytics.buildings = buildingAnalytics;
    }

    if (metric === 'users' || metric === 'all') {
      const userAnalytics = await User.aggregate([
        { $match: { createdAt: { $gte: last12Periods } } },
        {
          $group: {
            _id: dateGrouping,
            count: { $sum: 1 },
            roles: { $addToSet: '$role' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
      ]);

      analytics.users = userAnalytics;
    }

    if (metric === 'paths' || metric === 'all') {
      const pathQuery = campus ? { campus } : {};
      
      const pathAnalytics = await Path.aggregate([
        { $match: { ...pathQuery, createdAt: { $gte: last12Periods } } },
        {
          $group: {
            _id: dateGrouping,
            count: { $sum: 1 },
            totalDistance: { $sum: '$distance' },
            avgPopularity: { $avg: '$usage.popularity' },
            types: { $addToSet: '$type' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
      ]);

      analytics.paths = pathAnalytics;
    }

    if (metric === 'usage' || metric === 'all') {
      const pathQuery = campus ? { campus, status: { $in: ['active', 'Active'] } } : { status: { $in: ['active', 'Active'] } };
      
      const usageAnalytics = await Path.aggregate([
        { $match: pathQuery },
        {
          $group: {
            _id: '$type',
            totalPaths: { $sum: 1 },
            totalDistance: { $sum: '$distance' },
            avgPopularity: { $avg: '$usage.popularity' },
            totalDailyUsers: { $sum: '$usage.averageUsers.daily' },
            totalWeeklyUsers: { $sum: '$usage.averageUsers.weekly' },
            totalMonthlyUsers: { $sum: '$usage.averageUsers.monthly' }
          }
        },
        { $sort: { avgPopularity: -1 } }
      ]);

      analytics.usage = usageAnalytics;
    }

    res.json({
      success: true,
      data: {
        metric,
        period,
        campus: campus || 'all',
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/dashboard/health - Get system health status
router.get('/health', async (req, res) => {
  try {
    const database = require('../config/database');
    
    // Check database health
    const dbHealth = await database.healthCheck();
    
    // Check collection counts
    const [buildingCount, userCount, pathCount] = await Promise.all([
      Building.countDocuments(),
      User.countDocuments(),
      Path.countDocuments()
    ]);

    // Check for any system issues
    const issues = [];
    
    if (buildingCount === 0) {
      issues.push({ type: 'warning', message: 'No buildings found in database' });
    }
    
    if (userCount === 0) {
      issues.push({ type: 'warning', message: 'No users found in database' });
    }

    // Check for inactive/problematic records
    const [inactiveBuildings, suspendedUsers, closedPaths] = await Promise.all([
      Building.countDocuments({ status: { $ne: 'active' } }),
      User.countDocuments({ status: { $in: ['suspended', 'inactive'] } }),
      Path.countDocuments({ status: { $in: ['closed', 'maintenance'] } })
    ]);

    if (inactiveBuildings > buildingCount * 0.1) {
      issues.push({ type: 'warning', message: `High number of inactive buildings: ${inactiveBuildings}` });
    }

    if (suspendedUsers > userCount * 0.05) {
      issues.push({ type: 'warning', message: `High number of suspended users: ${suspendedUsers}` });
    }

    const systemHealth = {
      status: dbHealth.status === 'healthy' && issues.length === 0 ? 'healthy' : 'warning',
      database: dbHealth,
      collections: {
        buildings: buildingCount,
        users: userCount,
        paths: pathCount
      },
      issues: issues,
      lastChecked: new Date(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    res.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking system health',
      data: {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date()
      }
    });
  }
});

// GET /api/dashboard/quick-stats - Get quick statistics for dashboard widgets
router.get('/quick-stats', [
  query('campus').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { campus } = req.query;
    
    const buildingQuery = campus ? { 'location.campus': campus } : {};
    const pathQuery = campus ? { campus } : {};

    // Get quick counts
    const [buildings, users, paths, activePaths] = await Promise.all([
      Building.countDocuments({ ...buildingQuery, status: { $in: ['active', 'Active'] } }),
      User.countDocuments({ status: { $in: ['active', 'Active'] } }),
      Path.countDocuments(pathQuery),
      Path.countDocuments({ ...pathQuery, status: { $in: ['active', 'Active'] } })
    ]);

    // Get most popular path
    const popularPath = await Path.findOne(pathQuery)
      .sort({ 'usage.popularity': -1 })
      .select('name usage.popularity')
      .lean();

    // Get newest building
    const newestBuilding = await Building.findOne(buildingQuery)
      .sort({ createdAt: -1 })
      .select('name createdAt')
      .lean();

    const quickStats = {
      buildings: {
        total: buildings,
        newest: newestBuilding ? {
          name: newestBuilding.name,
          createdAt: newestBuilding.createdAt
        } : null
      },
      users: {
        total: users
      },
      paths: {
        total: paths,
        active: activePaths,
        mostPopular: popularPath ? {
          name: popularPath.name,
          popularity: popularPath.usage?.popularity || 0
        } : null
      },
      campus: campus || 'all'
    };

    res.json({
      success: true,
      data: quickStats
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    
    // Check if it's a database connection error
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out') || error.name === 'MongoNetworkError') {
      // Return fallback data when database is unavailable
      const { campus } = req.query;
      const fallbackQuickStats = {
        buildings: {
          total: 15,
          newest: {
            name: 'New Academic Building',
            createdAt: new Date()
          }
        },
        users: {
          total: 250
        },
        paths: {
          total: 45,
          active: 42,
          mostPopular: {
            name: 'Main Campus Walk',
            popularity: 95
          }
        },
        campus: campus || 'all'
      };
      
      return res.json({
        success: true,
        data: fallbackQuickStats,
        fallback: true,
        message: 'Using offline data - database unavailable'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching quick statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;