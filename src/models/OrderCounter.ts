import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderCounter extends Document {
  _id: string;
  date: string; // YYYY-MM-DD format
  counter: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderCounterSchema = new Schema<IOrderCounter>({
  date: {
    type: String,
    required: true,
    unique: true
  },
  counter: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
OrderCounterSchema.index({ date: 1 });

export default mongoose.models.OrderCounter || mongoose.model<IOrderCounter>('OrderCounter', OrderCounterSchema);
