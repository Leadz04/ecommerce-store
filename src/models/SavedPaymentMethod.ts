import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedPaymentMethod extends Document {
  _id: string;
  userId: string; // Required - only authenticated users can save payment methods
  paymentMethodId: string; // Stripe PaymentMethod ID
  type: 'card'; // Currently only supporting cards
  card: {
    brand: string; // visa, mastercard, amex, etc.
    last4: string; // Last 4 digits
    expMonth: number;
    expYear: number;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedPaymentMethodSchema = new Schema<ISavedPaymentMethod>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    paymentMethodId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['card'],
      default: 'card',
    },
    card: {
      brand: {
        type: String,
        required: true,
      },
      last4: {
        type: String,
        required: true,
      },
      expMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
      },
      expYear: {
        type: Number,
        required: true,
      },
    },
    billingDetails: {
      name: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postal_code: String,
        country: String,
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user and default status
SavedPaymentMethodSchema.index({ userId: 1, isDefault: 1 });

// Ensure only one default payment method per user
SavedPaymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('SavedPaymentMethod').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export default mongoose.models.SavedPaymentMethod || mongoose.model<ISavedPaymentMethod>('SavedPaymentMethod', SavedPaymentMethodSchema);

