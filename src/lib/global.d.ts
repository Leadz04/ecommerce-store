import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
  // Allow importing 'react-hot-toast' without TS types present
  // This avoids type errors if @types package isn't installed
  declare module 'react-hot-toast';
}
