const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { sanitizeInput, rateLimits, securityHeaders } = require('./middleware/security');
const { errorHandler, notFound } = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet(securityHeaders)); // Set security headers
app.use(mongoSanitize()); // Prevent NoSQL injection attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(sanitizeInput); // Custom input sanitization

// Apply rate limiting
app.use('/api/', rateLimits.general);
app.use('/api/users/login', rateLimits.auth);
app.use('/api/users/register', rateLimits.auth);
app.use('/api/*/images', rateLimits.upload);

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'UMP Admin API is running!',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint without database
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API endpoints are working!',
    endpoints: {
      health: '/api/health',
      buildings: '/api/buildings',
      users: '/api/users',
      paths: '/api/paths',
      dashboard: '/api/dashboard'
    }
  });
});

// Import and use API routes
const buildingsRouter = require('./routes/buildings');
const usersRouter = require('./routes/users');
const adminsRouter = require('./routes/admins');
const pathsRouter = require('./routes/paths');
const dashboardRouter = require('./routes/dashboard');

app.use('/api/buildings', buildingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/admins', adminsRouter);
app.use('/api/paths', pathsRouter);
app.use('/api/dashboard', dashboardRouter);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB with enhanced error handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ump-admin', {
       maxPoolSize: 10, // Maintain up to 10 socket connections
       serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
       socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
     });
    console.log('✅ MongoDB connected successfully');
    console.log(`🔒 Security middleware enabled`);
    console.log(`🛡️  Rate limiting active`);
   } catch (error) {
     console.error('❌ MongoDB connection error:', error.message);
     console.log('⚠️  Server will continue running with limited functionality');
     console.log('💡 To enable full functionality, please start MongoDB');
   }
};

// Connect to database
connectDB();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});