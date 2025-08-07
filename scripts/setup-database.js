const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/database');
const User = require('../src/models/User');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');
    
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Drop existing collections if they exist (for fresh setup)
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`🗑️  Dropped collection: ${collection.name}`);
    }

    // Create indexes
    await User.createIndexes();
    console.log('📊 Database indexes created');

    // Create test user for development
    if (process.env.NODE_ENV === 'development') {
      const testUser = new User({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
      
      // Note: This will fail until password hashing is implemented
      try {
        await testUser.save();
        console.log('👤 Test user created: test@example.com');
      } catch (error) {
        console.log('⚠️  Test user creation skipped (implement password hashing first)');
      }
    }

    console.log('🎉 Database setup complete!');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    await disconnectDB();
    process.exit(1);
  }
};

setupDatabase();
