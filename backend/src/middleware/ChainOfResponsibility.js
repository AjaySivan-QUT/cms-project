const logger = require('../patterns/singleton/Logger');

// Base Handler
class Handler {
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }

  handle(request, response, next) {
    if (this.nextHandler) {
      return this.nextHandler.handle(request, response, next);
    }
    return next();
  }
}

// Concrete Handler: Logger
class LoggerHandler extends Handler {
  handle(req, res, next) {
    logger.log(`${req.method} ${req.url}`);
    return super.handle(req, res, next);
  }
}

// Concrete Handler: Authentication Check
class AuthHandler extends Handler {
  handle(req, res, next) {
    const token = req.headers.authorization;
    
    // Skip auth for public routes
    if (req.url.includes('/api/auth') || 
        (req.url.includes('/api/posts') && req.method === 'GET')) {
      return super.handle(req, res, next);
    }
    
    return super.handle(req, res, next);
  }
}

// Concrete Handler: Validation
class ValidationHandler extends Handler {
  handle(req, res, next) {
    if (req.method === 'POST' && req.url.includes('/api/posts')) {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ 
          message: 'Title and content are required' 
        });
      }
    }
    return super.handle(req, res, next);
  }
}

// Build the chain
const requestHandler = new LoggerHandler();
requestHandler
  .setNext(new AuthHandler())
  .setNext(new ValidationHandler());

module.exports = (req, res, next) => requestHandler.handle(req, res, next);