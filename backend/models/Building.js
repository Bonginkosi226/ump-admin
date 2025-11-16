const mongoose = require('mongoose');
const Admin = require('./Admin');

const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Building name is required'],
    trim: true,
    maxlength: [100, 'Building name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Building code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [10, 'Building code cannot exceed 10 characters']
  },
  type: {
    type: String,
    required: [true, 'Building type is required'],
    enum: ['Academic', 'Administrative', 'Residential', 'Sports', 'Library', 'Laboratory', 'Other'],
    default: 'Academic'
  },
  floors: {
    type: Number,
    required: [true, 'Number of floors is required'],
    min: [1, 'Building must have at least 1 floor'],
    max: [50, 'Building cannot have more than 50 floors']
  },
  capacity: {
    type: Number,
    required: [true, 'Building capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  location: {
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    campus: {
      type: String,
      required: [true, 'Campus is required'],
      enum: ['Main Campus', 'Mbombela Campus', 'Siyabuswa Campus'],
      default: 'Main Campus'
    }
  },
  facilities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['Classroom', 'Laboratory', 'Office', 'Auditorium', 'Library', 'Cafeteria', 'Restroom', 'Other'],
      required: true
    },
    floor: {
      type: Number,
      required: true,
      min: 1
    },
    capacity: {
      type: Number,
      min: 1
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Under Construction', 'Maintenance', 'Inactive'],
    default: 'Active'
  },
  yearBuilt: {
    type: Number,
    min: [1900, 'Year built cannot be before 1900'],
    max: [new Date().getFullYear(), 'Year built cannot be in the future']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  accessibility: {
    wheelchairAccessible: {
      type: Boolean,
      default: false
    },
    elevatorAccess: {
      type: Boolean,
      default: false
    },
    parkingAvailable: {
      type: Boolean,
      default: false
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
    },
    manager: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
buildingSchema.index({ code: 1 });
buildingSchema.index({ type: 1 });
buildingSchema.index({ 'location.campus': 1 });
buildingSchema.index({ status: 1 });
buildingSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });

// Virtual for total facilities count
buildingSchema.virtual('totalFacilities').get(function() {
  return this.facilities.length;
});

// Virtual for primary image
buildingSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Pre-save middleware
buildingSchema.pre('save', function(next) {
  // Ensure only one primary image
  const primaryImages = this.images.filter(img => img.isPrimary);
  if (primaryImages.length > 1) {
    this.images.forEach((img, index) => {
      img.isPrimary = index === 0;
    });
  }
  next();
});

// Static methods
buildingSchema.statics.findByType = function(type) {
  return this.find({ type, status: 'Active' });
};

buildingSchema.statics.findByCampus = function(campus) {
  return this.find({ 'location.campus': campus, status: 'Active' });
};

buildingSchema.statics.findNearby = function(latitude, longitude, maxDistance = 1000) {
  return this.find({
    'location.coordinates.latitude': {
      $gte: latitude - (maxDistance / 111000),
      $lte: latitude + (maxDistance / 111000)
    },
    'location.coordinates.longitude': {
      $gte: longitude - (maxDistance / (111000 * Math.cos(latitude * Math.PI / 180))),
      $lte: longitude + (maxDistance / (111000 * Math.cos(latitude * Math.PI / 180)))
    },
    status: 'Active'
  });
};

buildingSchema.post('save', async function (doc, next) {
  if (this.isNew) {
    try {
      const admins = await Admin.find({ adminAlerts: true });
      for (const admin of admins) {
        // For now, we'll just log to the console.
        // In a real application, you would use a notification service (e.g., email, push notification)
        console.log(`Notifying admin ${admin.email}: A new building '${doc.name}' has been added.`);
      }
    } catch (error) {
      console.error('Error sending building notifications:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Building', buildingSchema);