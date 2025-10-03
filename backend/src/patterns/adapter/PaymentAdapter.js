class StripeAdapter {
  async pay(amount, currency) {
    console.log(`Processing $${amount} ${currency} via Stripe...`);
    return {
      success: true,
      provider: 'Stripe',
      amount: amount,
      currency: currency,
      transactionId: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

class PayPalAdapter {
  async pay(amount, currency) {
    console.log(`Processing $${amount} ${currency} via PayPal...`);
    return {
      success: true,
      provider: 'PayPal',
      amount: amount,
      currency: currency,
      transactionId: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

module.exports = { StripeAdapter, PayPalAdapter };