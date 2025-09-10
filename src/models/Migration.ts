import mongoose, { Document, Schema } from 'mongoose';

export interface IMigration extends Document {
  version: string;
  name: string;
  description: string;
  appliedAt: Date;
  executedBy: string;
  executionTime: number; // in milliseconds
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  rollbackVersion?: string;
}

const MigrationSchema = new Schema<IMigration>({
  version: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  executedBy: {
    type: String,
    required: true
  },
  executionTime: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  rollbackVersion: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.models.Migration || mongoose.model<IMigration>('Migration', MigrationSchema);
