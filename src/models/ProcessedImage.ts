import mongoose, { Document, Schema } from 'mongoose';

export interface IProcessedImage extends Document {
  productId?: string;
  productTitle: string;
  sourceImageUrl: string;
  cloudinaryUrl: string;
  geminiModel: string;
  geminiPrompt: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessedImageSchema = new Schema<IProcessedImage>({
  productId: { type: String },
  productTitle: { type: String, required: true, index: true },
  sourceImageUrl: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  geminiModel: { type: String, default: 'gemini-banana' },
  geminiPrompt: { type: String, default: '' },
  status: { type: String, enum: ['success', 'failed'], default: 'success', index: true },
  errorMessage: { type: String },
}, { timestamps: true });

export default mongoose.models.ProcessedImage || mongoose.model<IProcessedImage>('ProcessedImage', ProcessedImageSchema);


