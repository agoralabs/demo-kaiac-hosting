const mockTldPrices = {
    'com': {
        registration: 14.0,
        renewal: 14.0,
        transfer: 14.0,
        currency: "EUR",
        exchange_rate: 0.92,
        last_updated: new Date().toISOString()
      },
    'org': {
        registration: 14.0,
        renewal: 14.0,
        transfer: 14.0,
        currency: "EUR",
        exchange_rate: 0.92,
        last_updated: new Date().toISOString()
      },
    'fr': {
        registration: 12.0,
        renewal: 12.0,
        transfer: 12.0,
        currency: "EUR",
        exchange_rate: 0.92,
        last_updated: new Date().toISOString()
      },
    'net': {
        registration: 15.0,
        renewal: 15.0,
        transfer: 15.0,
        currency: "EUR",
        exchange_rate: 0.92,
        last_updated: new Date().toISOString()
      },
    'io': {
        registration: 71.0,
        renewal: 71.0,
        transfer: 71.0,
        currency: "EUR",
        exchange_rate: 0.92,
        last_updated: new Date().toISOString()
      },
    'dev': {
        registration: 1500.0,
        renewal: 1500.0,
        transfer: 1500.0,
        currency: "EUR",
        exchange_rate: 0.92,
        last_updated: new Date().toISOString()
      }
  };
  
  exports.mockCheckDomain = function(domainName) {
    const tld = domainName.split('.').pop();
    const available = Math.random() > 0.3; // 70% de chance d'être disponible
    const prices = mockTldPrices[tld] || {
        registration: 14.0,
        renewal: 14.0,
        transfer: 14.0,
        currency: "EUR",
        exchange_rate: 0.92,
        last_updated: new Date().toISOString()
      };
  
    console.log(`[MOCK] Checking domain: ${domainName}`, {
      available,
      prices,
      tld
    });
  
    return {
      available,
      prices
    };
  };
  
  exports.mockRegisterDomain = function(domainName, contactInfo, duration) {
    const tld = domainName.split('.').pop();
    const prices = mockTldPrices[tld] || {
        registration: 14.0,
        renewal: 14.0,
        transfer: 14.0,
        currency: "EUR",
        exchange_rate: 0.92,
        last_updated: new Date().toISOString()
      };
  
    console.log(`[MOCK] Registering domain: ${domainName}`, {
      duration,
      price: prices.registration * duration,
      contactInfo: {
        ...contactInfo,
        email: '[redacted]',
        phone: '[redacted]'
      }
    });
  
    return {
      success: true,
      domain: domainName,
      OperationId: `mock-${Math.random().toString(36).substr(2, 8)}`,
      price: prices.registration * duration,
      duration
    };
  };