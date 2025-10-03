const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const UserFactory = require('../patterns/factory/UserFactory');
const logger = require('../patterns/singleton/Logger');
const eventManager = require('../patterns/observer/EventManager');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Use Factory Pattern to create user
    const userFactory = new UserFactory(username, email, password, role || 'viewer');
    const user = await userFactory.save();

    // FIXED: Use userId instead of id
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // FIXED: Create session in database
    await Session.create({
      userId: user._id,
      token: token,
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    logger.log(`New user registered: ${username}`);
    
    // Trigger Observer Pattern - User Registered Event
    eventManager.notify('user_registered', {
      userId: user._id,
      username: user.username
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // FIXED: Use userId instead of id
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // FIXED: Deactivate old sessions
    await Session.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    // FIXED: Create new session
    await Session.create({
      userId: user._id,
      token: token,
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    logger.log(`User logged in: ${user.username}`);
    
    // Trigger Observer Pattern - User Login Event
    eventManager.notify('user_logged_in', {
      userId: user._id,
      username: user.username
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // FIXED: Deactivate session on logout
    await Session.updateOne(
      { token: req.token },
      { isActive: false }
    );

    logger.log(`User logged out: ${req.user.id}`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;