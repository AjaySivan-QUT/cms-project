const chai = require('chai');
const expect = chai.expect;
const logger = require('../src/patterns/singleton/Logger');
const eventManager = require('../src/patterns/observer/EventManager');
const { BasePost, ViewCountDecorator, SEODecorator } = require('../src/patterns/decorator/PostDecorator');
const { StripeAdapter, PayPalAdapter } = require('../src/patterns/adapter/PaymentAdapter');

describe('Singleton Pattern Tests', function() {
  
  it('should return the same Logger instance', () => {
    const logger1 = require('../src/patterns/singleton/Logger');
    const logger2 = require('../src/patterns/singleton/Logger');
    
    expect(logger1).to.equal(logger2);
  });

  it('should log messages to singleton instance', () => {
    logger.log('Test message');
    const logs = logger.getLogs();
    
    expect(logs).to.be.an('array');
    expect(logs.length).to.be.greaterThan(0);
  });
});

describe('Observer Pattern Tests', function() {
  
  it('should notify observers when event occurs', (done) => {
    const testObserver = {
      update: (eventType, data) => {
        expect(eventType).to.equal('test_event');
        expect(data).to.have.property('message', 'test');
        done();
      }
    };

    eventManager.subscribe('test_event', testObserver);
    eventManager.notify('test_event', { message: 'test' });
  });
});

describe('Decorator Pattern Tests', function() {
  
  it('should decorate post with view count', () => {
    const mockPost = {
      _doc: {
        title: 'Test Post',
        content: 'Test content',
        views: 0,
        likes: 5
      }
    };

    let decorated = new BasePost(mockPost);
    decorated = new ViewCountDecorator(decorated);
    
    const result = decorated.getDetails();
    
    expect(result).to.have.property('views');
    expect(result).to.have.property('popularity');
  });

  it('should decorate post with SEO metadata', () => {
    const mockPost = {
      _doc: {
        title: 'SEO Test Post',
        content: 'This is test content for SEO',
        views: 0,
        likes: 0
      }
    };

    let decorated = new BasePost(mockPost);
    decorated = new SEODecorator(decorated);
    
    const result = decorated.getDetails();
    
    expect(result).to.have.property('seo');
    expect(result.seo).to.have.property('slug');
    expect(result.seo).to.have.property('metaDescription');
    expect(result.seo).to.have.property('keywords');
  });

  it('should chain multiple decorators', () => {
    const mockPost = {
      _doc: {
        title: 'Chain Test',
        content: 'Content for testing',
        views: 0,
        likes: 10
      }
    };

    let decorated = new BasePost(mockPost);
    decorated = new ViewCountDecorator(decorated);
    decorated = new SEODecorator(decorated);
    
    const result = decorated.getDetails();
    
    expect(result).to.have.property('views');
    expect(result).to.have.property('popularity');
    expect(result).to.have.property('seo');
  });
});

describe('Adapter Pattern Tests', function() {
  
  it('should process payment through Stripe adapter', async () => {
    const stripe = new StripeAdapter();
    const result = await stripe.pay(100, 'USD');
    
    expect(result).to.have.property('success', true);
    expect(result).to.have.property('provider', 'Stripe');
    expect(result).to.have.property('amount', 100);
    expect(result).to.have.property('transactionId');
  });

  it('should process payment through PayPal adapter', async () => {
    const paypal = new PayPalAdapter();
    const result = await paypal.pay(200, 'USD');
    
    expect(result).to.have.property('success', true);
    expect(result).to.have.property('provider', 'PayPal');
    expect(result).to.have.property('amount', 200);
    expect(result).to.have.property('transactionId');
  });

  it('should have uniform interface for different adapters', async () => {
    const stripe = new StripeAdapter();
    const paypal = new PayPalAdapter();
    
    const stripeResult = await stripe.pay(50, 'USD');
    const paypalResult = await paypal.pay(50, 'USD');
    
    expect(stripeResult).to.have.all.keys('success', 'provider', 'amount', 'currency', 'transactionId');
    expect(paypalResult).to.have.all.keys('success', 'provider', 'amount', 'currency', 'transactionId');
  });
});