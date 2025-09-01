const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/zoconut';

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 Connection URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Test creating a simple document
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', TestSchema);
    
    const testDoc = new TestModel({ name: 'Connection Test' });
    await testDoc.save();
    
    console.log('✅ Successfully created test document!');
    
    // Clean up
    await TestModel.deleteMany({});
    console.log('🧹 Cleaned up test data');
    
    await mongoose.connection.close();
    console.log('👋 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure MongoDB is running:');
      console.log('   brew services start mongodb-community');
      console.log('2. Check if MongoDB is installed:');
      console.log('   brew list | grep mongodb');
      console.log('3. Try connecting manually:');
      console.log('   mongosh');
    }
    
    process.exit(1);
  }
}

testConnection();
