import mongoose, { Schema } from 'mongoose';
import { IUser, UserRole, UserStatus } from '@/types';

const availabilitySchema = new Schema({
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
});

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.CLIENT
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // Dietitian specific fields
  credentials: [{
    type: String
  }],
  specializations: [{
    type: String
  }],
  experience: {
    type: Number,
    min: 0
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  consultationFee: {
    type: Number,
    min: 0
  },
  availability: [availabilitySchema],
  
  // Client specific fields
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  height: {
    type: Number,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
  },
  healthGoals: [{
    type: String
  }],
  medicalConditions: [{
    type: String
  }],
  allergies: [{
    type: String
  }],
  dietaryRestrictions: [{
    type: String
  }],
  assignedDietitian: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance (email index is automatic due to unique: true)
userSchema.index({ role: 1 });
userSchema.index({ assignedDietitian: 1 });

// Simple password comparison method (no hashing)
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return this.password === candidatePassword;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    delete ret.password;
    return ret;
  }
});

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
