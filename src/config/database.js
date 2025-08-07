const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use test database if in test environment
    const dbUri = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auth_api_test'
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_api';

    const conn = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    }
    
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (process.env.NODE_ENV !== 'test') {
      console.log('📊 MongoDB Disconnected');
    }
  } catch (error) {
    console.error('Database disconnection error:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
