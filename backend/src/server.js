const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbConnection = require('./config/database');
const logger = require('./patterns/singleton/Logger');
const { verifyToken, authorize } = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const contentFacade = require('./patterns/facade/ContentManagementFacade');
const { PostSorter, DateSortStrategy, PopularitySortStrategy, TitleSortStrategy } = require('./patterns/strategy/SortStrategy');
const { BasePost, ViewCountDecorator, SEODecorator } = require('./patterns/decorator/PostDecorator');
const { StripeAdapter, PayPalAdapter } = require('./patterns/adapter/PaymentAdapter');
const eventManager = require('./patterns/observer/EventManager');

const User = require('./models/User');
const Post = require('./models/Post');
const Activity = require('./models/Activity');

const app = express();

// Configure multer for file uploads with proper storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Connect to database
dbConnection.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_advanced');

// ============================================
// AUTHENTICATION ROUTES
// ============================================
app.use('/api/auth', authRoutes);

// ============================================
// USER ROUTES
// ============================================
app.get('/api/users', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// POST ROUTES
// ============================================

// Get all posts (PUBLIC with STRATEGY PATTERN for sorting)
app.get('/api/posts', async (req, res) => {
  try {
    const { sortBy } = req.query;
    let posts = await Post.find()
      .populate('author', 'username email')
      .populate('category', 'name');

    // STRATEGY PATTERN - Choose sorting strategy
    let sorter;
    switch(sortBy) {
      case 'popularity':
        sorter = new PostSorter(new PopularitySortStrategy());
        logger.log('Using Popularity Sort Strategy');
        break;
      case 'title':
        sorter = new PostSorter(new TitleSortStrategy());
        logger.log('Using Title Sort Strategy');
        break;
      case 'date':
      default:
        sorter = new PostSorter(new DateSortStrategy());
        logger.log('Using Date Sort Strategy');
    }

    posts = sorter.sortPosts(posts);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single post (PUBLIC with DECORATOR PATTERN)
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username email')
      .populate('category', 'name');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // DECORATOR PATTERN - Enhance post with additional features
    let enhancedPost = new BasePost(post);
    enhancedPost = new ViewCountDecorator(enhancedPost);
    enhancedPost = new SEODecorator(enhancedPost);
    
    const postDetails = enhancedPost.getDetails();
    
    logger.log(`Post decorated with view count and SEO metadata`);
    
    res.json(postDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create post with image upload (PROTECTED with FACADE PATTERN)
app.post('/api/posts', verifyToken, authorize('admin', 'editor'), upload.single('image'), async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    // Prepare post data
    const postData = { title, content };
    
    // Add image data if file was uploaded
    if (req.file) {
      postData.imageUrl = `/uploads/${req.file.filename}`;
      postData.imageName = req.file.originalname;
      logger.log(`Image uploaded: ${req.file.filename}`);
    }
    
    // FACADE PATTERN - Simplifies complex post creation
    const post = await contentFacade.createCompletePost(
      postData,
      category || 'General',
      req.user.id
    );
    
    logger.log(`Post created using Facade Pattern: ${post.title}`);
    
    // Trigger Observer Pattern - Post Created Event
    eventManager.notify('post_created', {
      postId: post._id,
      title: post.title,
      userId: req.user.id
    });
    
    res.status(201).json(post);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// Update post with image upload (PROTECTED)
app.put('/api/posts/:id', verifyToken, authorize('admin', 'editor'), upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {
      title: req.body.title,
      content: req.body.content,
      updatedAt: Date.now()
    };

    // Handle new image upload
    if (req.file) {
      // Delete old image if it exists
      if (post.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', post.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          logger.log(`Deleted old image: ${post.imageUrl}`);
        }
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
      updateData.imageName = req.file.originalname;
      logger.log(`New image uploaded: ${req.file.filename}`);
    }

    if (req.body.status) {
      if (req.body.status === 'published' && req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Only administrators can publish posts' 
        });
      }
      updateData.status = req.body.status;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('author', 'username email')
      .populate('category', 'name');

    // Trigger Observer Pattern - Post Updated Event
    eventManager.notify('post_updated', {
      postId: updatedPost._id,
      title: updatedPost.title,
      userId: req.user.id
    });

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete post (PROTECTED)
app.delete('/api/posts/:id', verifyToken, authorize('admin', 'editor'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete associated image if exists
    if (post.imageUrl) {
      const imagePath = path.join(__dirname, '..', post.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        logger.log(`Deleted image: ${post.imageUrl}`);
      }
    }

    const user = await User.findById(req.user.id);

    await Post.findByIdAndDelete(req.params.id);
    
    // Trigger Observer Pattern - Post Deleted Event
    eventManager.notify('post_deleted', {
      postId: post._id,
      title: post.title,
      userId: req.user.id,
      username: user.username
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Publish post (PROTECTED - ADMIN ONLY with FACADE PATTERN)
app.put('/api/posts/:id/publish', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const publishedPost = await contentFacade.publishPostWithNotification(req.params.id);
    
    logger.log(`Post published with notifications: ${publishedPost.title}`);
    
    // Trigger Observer Pattern - Post Published Event
    eventManager.notify('post_published', {
      postId: publishedPost._id,
      title: publishedPost.title,
      userId: req.user.id
    });
    
    res.json(publishedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// PAYMENT ROUTES (ADAPTER PATTERN DEMO)
// ============================================

app.post('/api/payments/demo', verifyToken, async (req, res) => {
  try {
    const { provider, amount, currency } = req.body;
    
    let paymentProcessor;
    if (provider === 'stripe') {
      paymentProcessor = new StripeAdapter();
      logger.log('Using Stripe Adapter for payment');
    } else {
      paymentProcessor = new PayPalAdapter();
      logger.log('Using PayPal Adapter for payment');
    }
    
    const result = await paymentProcessor.pay(amount || 10, currency || 'USD');
    
    res.json({ 
      success: true, 
      result,
      message: 'Adapter Pattern demonstration - unified payment interface'
    });
  } catch (error) {
    logger.error(`Payment demo error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// ACTIVITY/NOTIFICATIONS ROUTES (OBSERVER PATTERN)
// ============================================

app.get('/api/activity', verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'username')
      .lean();

    const formattedActivities = activities.map(activity => ({
      type: activity.type,
      message: activity.message,
      icon: activity.icon,
      timestamp: activity.timestamp,
      user: activity.user?.username
    }));

    res.json({ 
      activities: formattedActivities,
      message: 'Observer Pattern - Real event notifications from database'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// SYSTEM ROUTES
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CMS API is running',
    patterns: {
      singleton: 'Logger (active)',
      factory: 'User creation (active)',
      strategy: 'Post sorting (active)',
      observer: 'Event notifications (active)',
      decorator: 'Post enhancement (active)',
      adapter: 'Payment gateways (active)',
      facade: 'Content management (active)'
    }
  });
});

app.get('/api/logs', verifyToken, authorize('admin'), (req, res) => {
  res.json({ 
    logs: logger.getLogs(),
    message: 'Singleton Pattern - Single logger instance'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.log(`Server running on port ${PORT}`);
  console.log(`🚀 Server is ready at http://localhost:${PORT}`);
  console.log(`📝 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;