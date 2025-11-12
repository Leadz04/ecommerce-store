import 'mongoose';

declare module 'mongoose' {
  interface Model<T> {
    find(...args: any[]): any;
    findOne(...args: any[]): any;
    findById(...args: any[]): any;
    findOneAndUpdate(...args: any[]): any;
    findByIdAndUpdate(...args: any[]): any;
    findOneAndDelete(...args: any[]): any;
    findByIdAndDelete(...args: any[]): any;
    updateOne(...args: any[]): any;
    updateMany(...args: any[]): any;
    deleteOne(...args: any[]): any;
    deleteMany(...args: any[]): any;
    countDocuments(...args: any[]): any;
    aggregate(...args: any[]): any;
    create(...args: any[]): any;
  }
}

