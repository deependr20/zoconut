import mongoose, { Schema } from 'mongoose';
import { IProgressEntry } from '@/types';

const measurementsSchema = new Schema({
  chest: {
    type: Number,
    min: 0
  },
  waist: {
    type: Number,
    min: 0
  },
  hips: {
    type: Number,
    min: 0
  },
  arms: {
    type: Number,
    min: 0
  },
  thighs: {
    type: Number,
    min: 0
  }
});

const progressEntrySchema = new Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dietitian: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  weight: {
    type: Number,
    min: 0,
    max: 1000
  },
  bodyFat: {
    type: Number,
    min: 0,
    max: 100
  },
  muscleMass: {
    type: Number,
    min: 0,
    max: 100
  },
  measurements: measurementsSchema,
  photos: [{
    type: String
  }],
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
progressEntrySchema.index({ client: 1, date: -1 });
progressEntrySchema.index({ dietitian: 1, date: -1 });
progressEntrySchema.index({ date: -1 });

// Compound index for client progress tracking
progressEntrySchema.index({ client: 1, date: 1 });

// Static method to get client progress history
progressEntrySchema.statics.getClientProgress = function(clientId: string, limit = 50, skip = 0) {
  return this.find({ client: clientId })
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip)
    .populate('dietitian', 'firstName lastName');
};

// Static method to get progress within date range
progressEntrySchema.statics.getProgressInRange = function(
  clientId: string, 
  startDate: Date, 
  endDate: Date
) {
  return this.find({
    client: clientId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

// Static method to get latest progress entry
progressEntrySchema.statics.getLatestProgress = function(clientId: string) {
  return this.findOne({ client: clientId })
    .sort({ date: -1 })
    .populate('dietitian', 'firstName lastName');
};

// Static method to get weight progress data for charts
progressEntrySchema.statics.getWeightProgressData = function(clientId: string, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    client: clientId,
    date: { $gte: startDate },
    weight: { $exists: true }
  })
  .select('date weight')
  .sort({ date: 1 });
};

// Static method to get body composition progress
progressEntrySchema.statics.getBodyCompositionData = function(clientId: string, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    client: clientId,
    date: { $gte: startDate },
    $or: [
      { bodyFat: { $exists: true } },
      { muscleMass: { $exists: true } }
    ]
  })
  .select('date bodyFat muscleMass')
  .sort({ date: 1 });
};

// Static method to get measurements progress
progressEntrySchema.statics.getMeasurementsData = function(clientId: string, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    client: clientId,
    date: { $gte: startDate },
    measurements: { $exists: true }
  })
  .select('date measurements')
  .sort({ date: 1 });
};

// Method to calculate BMI if height is available
progressEntrySchema.methods.calculateBMI = async function() {
  if (!this.weight) return null;
  
  const client = await mongoose.model('User').findById(this.client).select('height');
  if (!client || !client.height) return null;
  
  const heightInMeters = client.height / 100;
  return Math.round((this.weight / (heightInMeters * heightInMeters)) * 10) / 10;
};

// Virtual for progress summary
progressEntrySchema.virtual('summary').get(function() {
  const summary: any = {
    date: this.date,
    hasWeight: !!this.weight,
    hasBodyComposition: !!(this.bodyFat || this.muscleMass),
    hasMeasurements: !!(this.measurements && Object.keys(this.measurements).length > 0),
    hasPhotos: !!(this.photos && this.photos.length > 0),
    hasNotes: !!this.notes
  };
  
  return summary;
});

// Ensure virtual fields are serialized
progressEntrySchema.set('toJSON', {
  virtuals: true
});

const ProgressEntry = mongoose.models.ProgressEntry || mongoose.model<IProgressEntry>('ProgressEntry', progressEntrySchema);

export default ProgressEntry;
