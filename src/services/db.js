import mongoose from 'mongoose';

class DBClient {
  constructor() {
    this.connected = false;
  }

  async connect() {
    try {
      if (this.connected) return;

      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/distributed_drinks_store';
      
      await mongoose.connect(mongoUri);
      this.connected = true;
      console.log('✅ MongoDB Connected');
    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.connected) {
      await mongoose.disconnect();
      this.connected = false;
      console.log('✅ MongoDB Disconnected');
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new DBClient();
