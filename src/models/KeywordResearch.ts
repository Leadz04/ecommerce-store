import mongoose, { Document, Schema } from 'mongoose';

export interface IKeywordResearch extends Document {
  searchId: string;
  keywords: string[];
  country: string;
  language: string;
  searchMetadata: {
    id: string;
    status: string;
    createdAt: string;
    processedAt: string;
    totalTimeTaken: number;
    googleTrendsUrl: string;
  };
  searchParameters: {
    engine: string;
    q: string;
    hl: string;
    geo: string;
    date: string;
    tz: string;
    dataType: string;
  };
  interestOverTime: {
    timelineData: Array<{
      date: string;
      timestamp: string;
      values: Array<{
        query: string;
        value: string;
        extractedValue: number;
      }>;
      partialData?: boolean;
    }>;
  };
  relatedQueries?: Array<{
    query: string;
    value: string;
    extractedValue: number;
  }>;
  relatedTopics?: Array<{
    topic: string;
    value: string;
    extractedValue: number;
  }>;
  summary: {
    averageInterest: number;
    peakInterest: number;
    peakDate: string;
    currentInterest: number;
    trendDirection: 'up' | 'down' | 'stable';
    totalDataPoints: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const KeywordResearchSchema = new Schema<IKeywordResearch>({
  searchId: { type: String, required: true, unique: true },
  keywords: [{ type: String, required: true }],
  country: { type: String, required: true },
  language: { type: String, required: true },
  searchMetadata: {
    id: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: String, required: true },
    processedAt: { type: String, required: true },
    totalTimeTaken: { type: Number, required: true },
    googleTrendsUrl: { type: String, required: true }
  },
  searchParameters: {
    engine: { type: String, required: true },
    q: { type: String, required: true },
    hl: { type: String, required: true },
    geo: { type: String, required: true },
    date: { type: String, required: true },
    tz: { type: String, required: true },
    dataType: { type: String, required: true }
  },
  interestOverTime: {
    timelineData: [{
      date: { type: String, required: true },
      timestamp: { type: String, required: true },
      values: [{
        query: { type: String, required: true },
        value: { type: String, required: true },
        extractedValue: { type: Number, required: true }
      }],
      partialData: { type: Boolean, default: false }
    }]
  },
  relatedQueries: [{
    query: { type: String, required: true },
    value: { type: String, required: true },
    extractedValue: { type: Number, required: true }
  }],
  relatedTopics: [{
    topic: { type: String, required: true },
    value: { type: String, required: true },
    extractedValue: { type: Number, required: true }
  }],
  summary: {
    averageInterest: { type: Number, required: true },
    peakInterest: { type: Number, required: true },
    peakDate: { type: String, required: true },
    currentInterest: { type: Number, required: true },
    trendDirection: { type: String, enum: ['up', 'down', 'stable'], required: true },
    totalDataPoints: { type: Number, required: true }
  }
}, {
  timestamps: true
});

// Index for efficient queries
KeywordResearchSchema.index({ searchId: 1 });
KeywordResearchSchema.index({ keywords: 1 });
KeywordResearchSchema.index({ country: 1 });
KeywordResearchSchema.index({ createdAt: -1 });

export default mongoose.models.KeywordResearch || mongoose.model<IKeywordResearch>('KeywordResearch', KeywordResearchSchema);
