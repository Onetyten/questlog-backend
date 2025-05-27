import dotenv from 'dotenv'
dotenv.config()
// importing dontenv before everything else to allow process.env usage
import mongoose from "mongoose";
const MONGO_URL = process.env.MONGO_URL

// if the mongodb url is absent, trow an error
if (!MONGO_URL) {
  throw new Error(
    "Please define the MONGO_URL environment variable inside .env file"
  );
}

// this is what will hold the connection
let cached = global.mongoose;

// if the cached is empty, give it children conn and promise
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// connection function
async function mongoConnect() {
  // if cached connection is found, return it
  if (cached.conn) {
    console.log("Found cached connection")
    return cached.conn;
  }

  // else ceate a new connection
  if (!cached.promise) {
    console.log("Creating new connection")
    const opts = {
      bufferCommands: false,
    };
    // this is the line that connects the app to its mongodb url an sets the option since its async, a then method is used to return the cached.promise after connection
    cached.promise = mongoose.connect(MONGO_URL, opts).then((mongoose) => {
      return mongoose;
    });
  }
  // set the connection to the promise
  cached.conn = await cached.promise;
  return cached.conn;
}

export default mongoConnect;