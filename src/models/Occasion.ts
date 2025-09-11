import mongoose, { Document, Schema } from 'mongoose';

export interface IOccasion extends Document {
  _id: string;
  name: string;
  description: string;
  date: Date;
  orderDaysBefore: number;
  image: string;
  link: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const OccasionSchema = new Schema<IOccasion>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  date: {
    type: Date,
    required: true
  },
  orderDaysBefore: {
    type: Number,
    required: true,
    min: 1,
    max: 30,
    default: 3
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true,
    default: '/products?category=gifts'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
OccasionSchema.index({ date: 1, isActive: 1 });
OccasionSchema.index({ createdBy: 1 });

export default mongoose.models.Occasion || mongoose.model<IOccasion>('Occasion', OccasionSchema);
