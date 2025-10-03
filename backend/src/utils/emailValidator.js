class EmailValidator {
  static isValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static getDomain(email) {
    if (!this.isValid(email)) return null;
    return email.split('@')[1];
  }

  static isWorkEmail(email) {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = this.getDomain(email);
    return domain && !personalDomains.includes(domain);
  }
}

module.exports = EmailValidator;