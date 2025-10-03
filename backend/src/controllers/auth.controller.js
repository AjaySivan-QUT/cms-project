const User = require('../models/User');
const Session = require('../models/Session');
const UserFactory = require('../patterns/factory/UserFactory');
const { generateToken } = require('../middleware/auth');
const logger = require('../patterns/singleton/Logger');
const eventManager = require('../patterns/observer/EventManager');

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Username, email, and password are required' 
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    const userFactory = UserFactory.createUser({ 
      username, 
      email, 
      password, 
      role: role || 'viewer' 
    });
    
    const user = await userFactory.save();

    eventManager.notify('user_registered', { 
      userId: user._id, 
      username: user.username 
    });

    logger.log(`New user registered: ${username}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    await Session.create({
      userId: user._id,
      token,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      },
      isActive: true
    });

    const permissions = user.getPermissions();

    eventManager.notify('user_logged_in', { 
      userId: user._id, 
      username: user.username 
    });

    logger.log(`User logged in: ${user.username}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const token = req.token;

    await Session.updateOne(
      { token },
      { isActive: false }
    );

    eventManager.notify('user_logged_out', { 
      userId: req.user.id, 
      username: req.user.username 
    });

    logger.log(`User logged out: ${req.user.username}`);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        permissions: user.getPermissions(),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};