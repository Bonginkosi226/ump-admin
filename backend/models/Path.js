const mongoose = require('mongoose');

const pathSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Path name is required'],
    trim: true,
    maxlength: [100, 'Path name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['walking', 'cycling', 'vehicle', 'emergency', 'accessible', 'shuttle'],
    required: [true, 'Path type is required'],
    default: 'walking'
  },
  category: {
    type: String,
    enum: ['main', 'secondary', 'shortcut', 'scenic', 'emergency'],
    default: 'main'
  },
  coordinates: [{
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    elevation: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  startPoint: {
    name: {
      type: String,
      required: [true, 'Start point name is required'],
      trim: true
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building'
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Start point latitude is required']
      },
      lng: {
        type: Number,
        required: [true, 'Start point longitude is required']
      }
    },
    description: String
  },
  endPoint: {
    name: {
      type: String,
      required: [true, 'End point name is required'],
      trim: true
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building'
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'End point latitude is required']
      },
      lng: {
        type: Number,
        required: [true, 'End point longitude is required']
      }
    },
    description: String
  },
  waypoints: [{
    name: {
      type: String,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    description: String,
    type: {
      type: String,
      enum: ['landmark', 'intersection', 'rest_area', 'parking', 'entrance', 'exit'],
      default: 'landmark'
    }
  }],
  distance: {
    type: Number,
    min: [0, 'Distance cannot be negative'],
    default: 0 // in meters
  },
  estimatedTime: {
    walking: {
      type: Number,
      min: [0, 'Walking time cannot be negative'],
      default: 0 // in minutes
    },
    cycling: {
      type: Number,
      min: [0, 'Cycling time cannot be negative'],
      default: 0 // in minutes
    },
    driving: {
      type: Number,
      min: [0, 'Driving time cannot be negative'],
      default: 0 // in minutes
    }
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'difficult'],
    default: 'easy'
  },
  accessibility: {
    wheelchairAccessible: {
      type: Boolean,
      default: false
    },
    visuallyImpairedFriendly: {
      type: Boolean,
      default: false
    },
    hearingImpairedFriendly: {
      type: Boolean,
      default: false
    },
    elevatorAccess: {
      type: Boolean,
      default: false
    },
    rampAccess: {
      type: Boolean,
      default: false
    }
  },
  conditions: {
    surface: {
      type: String,
      enum: ['paved', 'gravel', 'dirt', 'grass', 'concrete', 'brick'],
      default: 'paved'
    },
    lighting: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'none'],
      default: 'good'
    },
    shelter: {
      type: Boolean,
      default: false
    },
    maintenance: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_construction', 'closed', 'maintenance'],
    default: 'active'
  },
  restrictions: {
    timeRestrictions: [{
      dayOfWeek: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // Format: "HH:MM"
      endTime: String,   // Format: "HH:MM"
      restricted: Boolean
    }],
    vehicleRestrictions: {
      cars: { type: Boolean, default: false },
      motorcycles: { type: Boolean, default: false },
      bicycles: { type: Boolean, default: false },
      pedestrians: { type: Boolean, default: false }
    },
    specialRestrictions: [{
      type: String,
      description: String,
      startDate: Date,
      endDate: Date
    }]
  },
  usage: {
    popularity: {
      type: Number,
      min: [0, 'Popularity cannot be negative'],
      max: [10, 'Popularity cannot exceed 10'],
      default: 5
    },
    averageUsers: {
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 }
    },
    peakHours: [{
      hour: {
        type: Number,
        min: 0,
        max: 23
      },
      usage: Number
    }]
  },
  safety: {
    emergencyPhones: [{
      coordinates: {
        lat: Number,
        lng: Number
      },
      description: String
    }],
    securityCameras: [{
      coordinates: {
        lat: Number,
        lng: Number
      },
      description: String
    }],
    lighting: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    safetyRating: {
      type: Number,
      min: [1, 'Safety rating must be between 1 and 5'],
      max: [5, 'Safety rating must be between 1 and 5'],
      default: 3
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  campus: {
    type: String,
    required: [true, 'Campus is required'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
pathSchema.index({ 'startPoint.coordinates': '2dsphere' });
pathSchema.index({ 'endPoint.coordinates': '2dsphere' });
pathSchema.index({ coordinates: '2dsphere' });
pathSchema.index({ type: 1, status: 1 });
pathSchema.index({ campus: 1, status: 1 });
pathSchema.index({ tags: 1 });
pathSchema.index({ createdBy: 1 });
pathSchema.index({ 'usage.popularity': -1 });

// Virtual for path length calculation
pathSchema.virtual('calculatedDistance').get(function() {
  if (this.coordinates.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < this.coordinates.length; i++) {
    const prev = this.coordinates[i - 1];
    const curr = this.coordinates[i];
    totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
  }
  return Math.round(totalDistance);
});

// Virtual for estimated walking time based on distance
pathSchema.virtual('estimatedWalkingTime').get(function() {
  // Average walking speed: 5 km/h = 83.33 m/min
  const walkingSpeedMPerMin = 83.33;
  return Math.ceil((this.distance || this.calculatedDistance) / walkingSpeedMPerMin);
});

// Pre-save middleware to calculate distance if not provided
pathSchema.pre('save', function(next) {
  if (!this.distance && this.coordinates.length >= 2) {
    this.distance = this.calculatedDistance;
  }
  
  // Auto-calculate estimated times if not provided
  if (!this.estimatedTime.walking) {
    this.estimatedTime.walking = this.estimatedWalkingTime;
  }
  if (!this.estimatedTime.cycling) {
    // Average cycling speed: 15 km/h = 250 m/min
    this.estimatedTime.cycling = Math.ceil(this.distance / 250);
  }
  if (!this.estimatedTime.driving) {
    // Average driving speed on campus: 30 km/h = 500 m/min
    this.estimatedTime.driving = Math.ceil(this.distance / 500);
  }
  
  next();
});

// Pre-save middleware to increment version
pathSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified()) {
    this.version += 1;
  }
  next();
});

// Static method to find paths by type
pathSchema.statics.findByType = function(type, campus = null) {
  const query = { type, status: 'active' };
  if (campus) query.campus = campus;
  return this.find(query).populate('createdBy', 'firstName lastName');
};

// Static method to find paths near a location
pathSchema.statics.findNearLocation = function(lat, lng, maxDistance = 1000, campus = null) {
  const query = {
    status: 'active',
    $or: [
      {
        'startPoint.coordinates': {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: maxDistance
          }
        }
      },
      {
        'endPoint.coordinates': {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: maxDistance
          }
        }
      }
    ]
  };
  
  if (campus) query.campus = campus;
  return this.find(query).populate('createdBy', 'firstName lastName');
};

// Static method to find accessible paths
pathSchema.statics.findAccessible = function(campus = null) {
  const query = {
    status: 'active',
    'accessibility.wheelchairAccessible': true
  };
  if (campus) query.campus = campus;
  return this.find(query).populate('createdBy', 'firstName lastName');
};

// Static method to find popular paths
pathSchema.statics.findPopular = function(limit = 10, campus = null) {
  const query = { status: 'active' };
  if (campus) query.campus = campus;
  return this.find(query)
    .sort({ 'usage.popularity': -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName');
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = mongoose.model('Path', pathSchema);