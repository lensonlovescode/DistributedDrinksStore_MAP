import mongoose from 'mongoose';

class Database {
  constructor() {
    this.connected = false;
  }

  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/distributed_drinks_store';
      
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.connected = true;
      console.log('Database connected successfully');
      return true;
    } catch (error) {
      console.error('Database connection error:', error.message);
      this.connected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.connected = false;
      console.log('Database disconnected');
    } catch (error) {
      console.error('Error disconnecting database:', error.message);
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new Database();
