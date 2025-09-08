import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  permissions: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries (name already has unique index from unique: true)
RoleSchema.index({ isActive: 1 });

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
