import mongoose, { Schema, Document } from 'mongoose';

export interface IEtsyFormField extends Document {
  fieldKey: string; // e.g., 'title', 'description', 'price', 'taxonomy_id'
  section: string; // e.g., 'listings', 'shipping', 'sections', 'policies'
  fieldName: string; // Display name
  fieldType: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'file';
  description?: string; // Help text/description from Etsy API
  placeholder?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>; // For select fields
  validationRules?: string; // JSON string of validation rules
  helpText?: string; // Additional help text
  example?: string; // Example value
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EtsyFormFieldSchema = new Schema<IEtsyFormField>({
  fieldKey: { type: String, required: true, index: true },
  section: { type: String, required: true, index: true },
  fieldName: { type: String, required: true },
  fieldType: { 
    type: String, 
    enum: ['text', 'textarea', 'number', 'select', 'checkbox', 'date', 'file'],
    required: true 
  },
  description: { type: String },
  placeholder: { type: String },
  required: { type: Boolean, default: false },
  minLength: { type: Number },
  maxLength: { type: Number },
  min: { type: Number },
  max: { type: Number },
  options: [{
    value: String,
    label: String
  }],
  validationRules: { type: String },
  helpText: { type: String },
  example: { type: String },
  lastSyncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for efficient queries
EtsyFormFieldSchema.index({ section: 1, fieldKey: 1 }, { unique: true });

const EtsyFormField = mongoose.models.EtsyFormField || mongoose.model<IEtsyFormField>('EtsyFormField', EtsyFormFieldSchema);

export default EtsyFormField;
