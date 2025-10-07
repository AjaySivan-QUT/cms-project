class PhoneValidator {
  static isValidUSPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
  }

  static formatUSPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)};
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return +1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)};
    }
    return phone;
  }

  static getAreaCode(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.slice(0, 3);
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return cleaned.slice(1, 4);
    }
    return null;
  }

  static isInternational(phone) {
    return phone.trim().startsWith('+');
  }
}

module.exports =PhoneValidator;