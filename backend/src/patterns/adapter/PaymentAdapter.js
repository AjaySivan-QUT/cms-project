// External Payment Services
class StripePayment {
  processStripePayment(amount, currency) {
    return { success: true, provider: 'Stripe', amount, currency };
  }
}

class PayPalPayment {
  makePayPalPayment(price, currencyCode) {
    return { status: 'completed', service: 'PayPal', price, currencyCode };
  }
}

// Target Interface
class PaymentProcessor {
  pay(amount, currency) {
    throw new Error('Method must be implemented');
  }
}

// Adapter for Stripe
class StripeAdapter extends PaymentProcessor {
  constructor() {
    super();
    this.stripe = new StripePayment();
  }

  pay(amount, currency) {
    return this.stripe.processStripePayment(amount, currency);
  }
}

// Adapter for PayPal
class PayPalAdapter extends PaymentProcessor {
  constructor() {
    super();
    this.paypal = new PayPalPayment();
  }

  pay(amount, currency) {
    const result = this.paypal.makePayPalPayment(amount, currency);
    return {
      success: result.status === 'completed',
      provider: result.service,
      amount: result.price,
      currency: result.currencyCode
    };
  }
}

module.exports = { StripeAdapter, PayPalAdapter };