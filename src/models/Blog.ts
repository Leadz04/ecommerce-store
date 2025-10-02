import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  contentHtml: string;
  coverImage?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishAt?: Date | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  versions: Array<{
    title: string;
    description?: string;
    contentHtml: string;
    coverImage?: string;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
    publishAt?: Date | null;
    versionAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
    maxlength: [200, 'Slug cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  contentHtml: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [200000, 'Content too long']
  },
  coverImage: {
    type: String,
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishAt: {
    type: Date,
    default: null,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  versions: [
    {
      title: { type: String, required: true },
      description: { type: String },
      contentHtml: { type: String, required: true },
      coverImage: { type: String },
      tags: [{ type: String }],
      status: { type: String, enum: ['draft', 'published', 'archived'], required: true },
      publishAt: { type: Date, default: null },
      versionAt: { type: Date, default: () => new Date() },
    },
  ]
}, {
  timestamps: true
});

BlogSchema.index({ status: 1, publishAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ isDeleted: 1 });

export default mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);


