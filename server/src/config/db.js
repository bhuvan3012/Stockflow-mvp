const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`Connecting to MongoDB URI...`);
      await mongoose.connect(uri);
      console.log(`MongoDB Connected successfully to ${mongoose.connection.host}`);
      return;
    } catch (err) {
      console.warn(`Failed to connect to provided MONGODB_URI: ${err.message}. Falling back to in-memory MongoDB.`);
    }
  }

  // Fallback to MongoMemoryServer for instant zero-config testing
  try {
    console.log('Starting In-Memory MongoDB server for instant zero-configuration demo...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`In-Memory MongoDB Connected at: ${memoryUri}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, disconnectDB };
