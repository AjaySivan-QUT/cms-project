const User = require('../../models/User');

class UserFactory {
  static createUser(userData) {
    const { role } = userData;
    
    switch(role) {
      case 'admin':
        return new AdminUser(userData);
      case 'editor':
        return new EditorUser(userData);
      case 'viewer':
        return new ViewerUser(userData);
      default:
        return new ViewerUser(userData);
    }
  }
}

// INHERITANCE: Admin extends base User capabilities
class AdminUser {
  constructor(userData) {
    this.data = userData;
    this.data.role = 'admin';
  }

  async save() {
    const user = new User(this.data);
    return await user.save();
  }

  getCapabilities() {
    return ['Full system access', 'User management', 'All content operations'];
  }
}

// INHERITANCE: Editor extends base User capabilities
class EditorUser {
  constructor(userData) {
    this.data = userData;
    this.data.role = 'editor';
  }

  async save() {
    const user = new User(this.data);
    return await user.save();
  }

  getCapabilities() {
    return ['Create content', 'Edit content', 'Publish content'];
  }
}

// INHERITANCE: Viewer extends base User capabilities
class ViewerUser {
  constructor(userData) {
    this.data = userData;
    this.data.role = 'viewer';
  }

  async save() {
    const user = new User(this.data);
    return await user.save();
  }

  getCapabilities() {
    return ['Read content', 'View published posts'];
  }
}

module.exports = UserFactory;