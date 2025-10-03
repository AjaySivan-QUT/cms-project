const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['post_created', 'post_published', 'post_updated', 'post_deleted', 'user_registered', 'user_logged_in']
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '📝'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);