const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const expect = chai.expect;
const UserFactory = require('../src/patterns/factory/UserFactory');
const User = require('../src/models/User');

chai.use(chaiHttp);

describe('User Factory Pattern Tests', function() {
  this.timeout(10000);

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_advanced_test');
    }
  });

  after(async () => {
    await User.deleteMany({});
  });

  it('should create an admin user with Factory pattern', async () => {
    const factory = new UserFactory('adminuser', 'admin@test.com', 'password123', 'admin');
    const user = await factory.save();
    
    expect(user).to.have.property('role', 'admin');
    expect(user).to.have.property('username', 'adminuser');
    
    await User.findByIdAndDelete(user._id);
  });

  it('should create an editor user with Factory pattern', async () => {
    const factory = new UserFactory('editoruser', 'editor@test.com', 'password123', 'editor');
    const user = await factory.save();
    
    expect(user).to.have.property('role', 'editor');
    expect(user).to.have.property('username', 'editoruser');
    
    await User.findByIdAndDelete(user._id);
  });

  it('should create a viewer user with Factory pattern', async () => {
    const factory = new UserFactory('vieweruser', 'viewer@test.com', 'password123', 'viewer');
    const user = await factory.save();
    
    expect(user).to.have.property('role', 'viewer');
    expect(user).to.have.property('username', 'vieweruser');
    
    await User.findByIdAndDelete(user._id);
  });

  it('should hash password using encapsulation', async () => {
    const factory = new UserFactory('testuser', 'test@test.com', 'plainpassword', 'viewer');
    const user = await factory.save();
    
    expect(user.password).to.not.equal('plainpassword');
    expect(user.password).to.have.length.greaterThan(20);
    
    await User.findByIdAndDelete(user._id);
  });
});

describe('OOP Principles Tests', function() {
  this.timeout(10000);

  after(async () => {
    await User.deleteMany({});
  });

  it('should demonstrate polymorphism with different user capabilities', async () => {
    const adminFactory = new UserFactory('admin1', 'admin1@test.com', 'pass123', 'admin');
    const editorFactory = new UserFactory('editor1', 'editor1@test.com', 'pass123', 'editor');
    
    const admin = await adminFactory.save();
    const editor = await editorFactory.save();
    
    expect(admin.role).to.not.equal(editor.role);
    
    await User.findByIdAndDelete(admin._id);
    await User.findByIdAndDelete(editor._id);
  });

  it('should demonstrate encapsulation with password comparison', async () => {
    const factory = new UserFactory('encaptest', 'encap@test.com', 'mypassword', 'viewer');
    const user = await factory.save();
    
    const isValid = await user.comparePassword('mypassword');
    const isInvalid = await user.comparePassword('wrongpassword');
    
    expect(isValid).to.be.true;
    expect(isInvalid).to.be.false;
    
    await User.findByIdAndDelete(user._id);
  });
});