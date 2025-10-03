const mongoose = require('mongoose');

// SINGLETON PATTERN - Only one database connection
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    this.connection = null;
    DatabaseConnection.instance = this;
  }

  async connect(uri) {
    if (this.connection) {
      console.log('Using existing database connection');
      return this.connection;
    }

    try {
      this.connection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully');
      return this.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new DatabaseConnection();