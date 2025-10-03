const Activity = require('../../models/Activity');

class EventManager {
  constructor() {
    this.observers = {};
  }

  subscribe(eventType, observer) {
    if (!this.observers[eventType]) {
      this.observers[eventType] = [];
    }
    this.observers[eventType].push(observer);
  }

  unsubscribe(eventType, observer) {
    if (!this.observers[eventType]) return;
    this.observers[eventType] = this.observers[eventType].filter(
      obs => obs !== observer
    );
  }

  notify(eventType, data) {
    if (!this.observers[eventType]) return;
    this.observers[eventType].forEach(observer => 
      observer.update(eventType, data)
    );
  }
}

// Enhanced observer that saves to database
class DatabaseActivityLogger {
  async update(eventType, data) {
    try {
      let message = '';
      let icon = '📝';
      
      switch(eventType) {
        case 'post_created':
          message = `New post created: "${data.title}"`;
          icon = '✉️';
          break;
        case 'post_published':
          message = `Post published: "${data.title}"`;
          icon = '📊';
          break;
        case 'post_updated':
          message = `Post updated: "${data.title}"`;
          icon = '✏️';
          break;
        case 'post_deleted':
          message = `Post deleted by ${data.username || 'user'}`;
          icon = '🗑️';
          break;
        case 'user_registered':
          message = `New user registered: ${data.username}`;
          icon = '👤';
          break;
        case 'user_logged_in':
          message = `User logged in: ${data.username}`;
          icon = '🔐';
          break;
      }

      await Activity.create({
        type: eventType,
        message: message,
        icon: icon,
        user: data.userId,
        metadata: data,
        timestamp: new Date()
      });

      console.log(`Activity logged: ${message}`);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}

// Email notifier (demo - logs to console)
class EmailNotifier {
  update(eventType, data) {
    console.log(`Email Notification: ${eventType} - ${JSON.stringify(data)}`);
  }
}

// Analytics tracker (demo - logs to console)
class AnalyticsTracker {
  update(eventType, data) {
    console.log(`Analytics: ${eventType} - ${JSON.stringify(data)}`);
  }
}

const eventManager = new EventManager();

// Subscribe observers to events
eventManager.subscribe('post_created', new DatabaseActivityLogger());
eventManager.subscribe('post_created', new EmailNotifier());
eventManager.subscribe('post_published', new DatabaseActivityLogger());
eventManager.subscribe('post_published', new AnalyticsTracker());
eventManager.subscribe('post_updated', new DatabaseActivityLogger());
eventManager.subscribe('post_deleted', new DatabaseActivityLogger());
eventManager.subscribe('user_registered', new DatabaseActivityLogger());
eventManager.subscribe('user_logged_in', new DatabaseActivityLogger());

module.exports = eventManager;