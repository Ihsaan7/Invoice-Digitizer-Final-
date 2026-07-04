import mongoose from "mongoose";

let connectPromise: Promise<typeof mongoose> | null = null;

export function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!connectPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not set. Add it to your environment secrets to connect to MongoDB."
      );
    }
    connectPromise = mongoose.connect(uri).catch((err) => {
      connectPromise = null;
      throw err;
    });
  }

  return connectPromise;
}

export { mongoose };
