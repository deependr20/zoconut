import mongoose, { Schema } from 'mongoose';
import { IAppointment, AppointmentStatus, AppointmentType } from '@/types';

const appointmentSchema = new Schema<IAppointment>({
  dietitian: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(AppointmentType),
    default: AppointmentType.CONSULTATION
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.SCHEDULED
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60, // 60 minutes default
    min: 15,
    max: 180
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  meetingLink: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
appointmentSchema.index({ dietitian: 1, scheduledAt: 1 });
appointmentSchema.index({ client: 1, scheduledAt: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ scheduledAt: 1 });

// Compound index for finding conflicts
appointmentSchema.index({ 
  dietitian: 1, 
  scheduledAt: 1, 
  status: 1 
});

// Virtual for appointment end time
appointmentSchema.virtual('endTime').get(function() {
  return new Date(this.scheduledAt.getTime() + (this.duration * 60 * 1000));
});

// Method to check if appointment conflicts with another
appointmentSchema.methods.conflictsWith = function(otherAppointment: IAppointment): boolean {
  const thisStart = this.scheduledAt;
  const thisEnd = this.endTime;
  const otherStart = otherAppointment.scheduledAt;
  const otherEnd = new Date(otherStart.getTime() + (otherAppointment.duration * 60 * 1000));
  
  return (thisStart < otherEnd && thisEnd > otherStart);
};

// Static method to find conflicting appointments
appointmentSchema.statics.findConflicts = function(
  dietitianId: string, 
  scheduledAt: Date, 
  duration: number, 
  excludeId?: string
) {
  const endTime = new Date(scheduledAt.getTime() + (duration * 60 * 1000));
  
  const query: any = {
    dietitian: dietitianId,
    status: { $in: [AppointmentStatus.SCHEDULED] },
    $or: [
      {
        scheduledAt: { $lt: endTime },
        $expr: {
          $gt: [
            { $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] },
            scheduledAt
          ]
        }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Ensure virtual fields are serialized
appointmentSchema.set('toJSON', {
  virtuals: true
});

const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', appointmentSchema);

export default Appointment;
