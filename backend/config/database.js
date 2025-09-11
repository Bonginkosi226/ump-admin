const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Prevent multiple connections
      if (this.isConnected) {
        console.log('📦 Database already connected');
        return this.connection;
      }

      // MongoDB connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority'
      };

      // Get MongoDB URI from environment variables
      const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/ump-admin';
      
      console.log('🔄 Connecting to MongoDB...');
      
      // Connect to MongoDB
      this.connection = await mongoose.connect(mongoURI, options);
      this.isConnected = true;
      
      console.log(`✅ MongoDB connected successfully to: ${this.connection.connection.host}`);
      console.log(`📊 Database: ${this.connection.connection.name}`);
      
      // Handle connection events
      this.setupEventHandlers();
      
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      this.isConnected = false;
      
      // Exit process with failure if initial connection fails
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      
      throw error;
    }
  }

  setupEventHandlers() {
    const db = mongoose.connection;

    // Connection successful
    db.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    // Connection error
    db.on('error', (error) => {
      console.error('🔴 Mongoose connection error:', error);
      this.isConnected = false;
    });

    // Connection disconnected
    db.on('disconnected', () => {
      console.log('🟡 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Connection reconnected
    db.on('reconnected', () => {
      console.log('🟢 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        this.isConnected = false;
        this.connection = null;
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
    }
  }

  async dropDatabase() {
    try {
      if (this.isConnected && process.env.NODE_ENV !== 'production') {
        await mongoose.connection.db.dropDatabase();
        console.log('🗑️ Database dropped successfully');
      } else {
        console.log('⚠️ Database drop skipped (production environment or not connected)');
      }
    } catch (error) {
      console.error('❌ Error dropping database:', error.message);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }

      // Perform a simple operation to check if the connection is working
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        details: this.getConnectionStatus()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database health check failed',
        error: error.message
      };
    }
  }

  // Seed database with initial data
  async seedDatabase() {
    try {
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️ Database seeding skipped in production');
        return;
      }

      const User = require('../models/User');
      const Building = require('../models/Building');
      const Path = require('../models/Path');

      // Check if data already exists
      const userCount = await User.countDocuments();
      const buildingCount = await Building.countDocuments();
      const pathCount = await Path.countDocuments();

      if (userCount > 0 || buildingCount > 0 || pathCount > 0) {
        console.log('📊 Database already contains data, skipping seed');
        return;
      }

      console.log('🌱 Seeding database with initial data...');

      // Create admin user
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@ump.ac.za',
        password: 'admin123456',
        role: 'admin',
        department: 'IT Services',
        employeeId: 'EMP001',
        emailVerified: true,
        status: 'active'
      });
      await adminUser.save();

      // Create sample buildings
      const buildings = [
        {
          name: 'Main Administration Building',
          code: 'ADMIN',
          type: 'administrative',
          location: {
            coordinates: { lat: -25.7479, lng: 28.2293 },
            address: 'University of Mpumalanga, Nelspruit Campus',
            campus: 'Nelspruit'
          },
          facilities: ['reception', 'offices', 'meeting_rooms'],
          status: 'active',
          yearBuilt: 2010,
          description: 'Main administrative building housing university management offices'
        },
        {
          name: 'Library and Information Centre',
          code: 'LIB',
          type: 'academic',
          location: {
            coordinates: { lat: -25.7485, lng: 28.2300 },
            address: 'University of Mpumalanga, Nelspruit Campus',
            campus: 'Nelspruit'
          },
          facilities: ['library', 'computer_lab', 'study_areas', 'wifi'],
          status: 'active',
          yearBuilt: 2012,
          description: 'Central library with extensive collection and digital resources'
        },
        {
          name: 'Student Centre',
          code: 'SC',
          type: 'student_services',
          location: {
            coordinates: { lat: -25.7490, lng: 28.2285 },
            address: 'University of Mpumalanga, Nelspruit Campus',
            campus: 'Nelspruit'
          },
          facilities: ['cafeteria', 'student_services', 'recreation', 'wifi'],
          status: 'active',
          yearBuilt: 2011,
          description: 'Central hub for student activities and services'
        }
      ];

      const savedBuildings = await Building.insertMany(buildings);

      // Create sample paths
      const paths = [
        {
          name: 'Main Campus Walk',
          description: 'Primary walking path connecting major buildings',
          type: 'walking',
          category: 'main',
          coordinates: [
            { lat: -25.7479, lng: 28.2293 },
            { lat: -25.7485, lng: 28.2300 },
            { lat: -25.7490, lng: 28.2285 }
          ],
          startPoint: {
            name: 'Main Administration Building',
            buildingId: savedBuildings[0]._id,
            coordinates: { lat: -25.7479, lng: 28.2293 }
          },
          endPoint: {
            name: 'Student Centre',
            buildingId: savedBuildings[2]._id,
            coordinates: { lat: -25.7490, lng: 28.2285 }
          },
          accessibility: {
            wheelchairAccessible: true,
            rampAccess: true
          },
          campus: 'Nelspruit',
          createdBy: adminUser._id,
          tags: ['main', 'accessible', 'paved']
        }
      ];

      await Path.insertMany(paths);

      console.log('✅ Database seeded successfully');
      console.log(`👤 Created ${buildings.length} buildings`);
      console.log(`🛤️ Created ${paths.length} paths`);
      console.log(`👨‍💼 Created admin user: admin@ump.ac.za / admin123456`);

    } catch (error) {
      console.error('❌ Error seeding database:', error.message);
    }
  }
}

// Create singleton instance
const database = new Database();

// Export both the instance and convenience functions
module.exports = {
  Database,
  connect: () => database.connect(),
  disconnect: () => database.disconnect(),
  seedDatabase: () => database.seedDatabase(),
  healthCheck: () => database.healthCheck(),
  dropDatabase: () => database.dropDatabase(),
  getConnectionStatus: () => database.getConnectionStatus(),
  // Export the singleton instance as default
  default: database,
  // For backward compatibility
  ...database
};