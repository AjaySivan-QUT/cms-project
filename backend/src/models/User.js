const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'editor', 'viewer'], 
    default: 'viewer' 
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// ENCAPSULATION: Password hashing before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ENCAPSULATION: Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// POLYMORPHISM: Different behavior based on role
userSchema.methods.getPermissions = function() {
  const permissions = {
    admin: ['create', 'read', 'update', 'delete', 'publish', 'manage_users'],
    editor: ['create', 'read', 'update', 'publish'],
    viewer: ['read']
  };
  return permissions[this.role] || [];
};

// ABSTRACTION: Hide implementation details
userSchema.methods.canPerformAction = function(action) {
  return this.getPermissions().includes(action);
};

module.exports = mongoose.model('User', userSchema);