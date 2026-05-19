const axios = require('axios');
const logger = require('./logger');

class DVSAScraper {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 5000;
    this.dvsaBaseUrl = 'https://driverpracticaltest.dvsa.gov.uk';
  }

  // Create axios instance with security headers
  createAxiosInstance() {
    return axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-GB,en;q=0.9',
        'DNT': '1'
      },
      validateStatus: function(status) {
        return status >= 200 && status < 500;
      }
    });
  }

  // Check for available slots with retry logic
  async checkSlots(centerId, testType = 'car') {
    let lastError = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        logger.info(`Checking slots for center ${centerId} (Attempt ${attempt}/${this.retries})`);

        const client = this.createAxiosInstance();
        const url = `${this.dvsaBaseUrl}/api/getavailabletest`;

        const payload = {
          testCentreId: centerId,
          testType: testType,
          preferredDate: this.getDateRange()
        };

        const response = await client.post(url, payload);

        if (response.status === 200 && response.data) {
          logger.info(`✓ Successfully retrieved data for center ${centerId}`, {
            slots_count: response.data.length || 0
          });
          return response.data;
        }

        if (response.status === 429) {
          lastError = 'Rate limited by DVSA';
          logger.warn('Rate limited - waiting before retry', { attempt });
          await this.delay(this.retryDelay * 2);
          continue;
        }

        if (response.status >= 500) {
          lastError = `Server error: ${response.status}`;
          logger.warn(`DVSA server error ${response.status}, retrying...`, { attempt });
          await this.delay(this.retryDelay);
          continue;
        }

        lastError = `HTTP ${response.status}`;
        await this.delay(this.retryDelay);

      } catch (error) {
        lastError = error.message;
        logger.warn(`Attempt ${attempt} failed: ${error.message}`);

        if (attempt < this.retries) {
          await this.delay(this.retryDelay);
        }
      }
    }

    logger.error(`Failed to check slots for center ${centerId} after ${this.retries} attempts`, {
      lastError
    });
    return [];
  }

  // Check all London centers
  async checkAllCenters(centers) {
    const results = {};
    const availableSlots = [];

    for (const center of centers) {
      try {
        const slots = await this.checkSlots(center.id);
        results[center.name] = slots;

        if (slots && slots.length > 0) {
          availableSlots.push({
            center: center.name,
            slots: slots
          });
          logger.success(`Found ${slots.length} slots at ${center.name}`);
        }
      } catch (error) {
        logger.error(`Error checking center ${center.name}`, { error: error.message });
        results[center.name] = [];
      }
    }

    return { results, availableSlots };
  }

  // Get date range for next 30 days
  getDateRange() {
    const today = new Date();
    const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      from: this.formatDate(today),
      to: this.formatDate(maxDate)
    };
  }

  // Format date as YYYY-MM-DD
  formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  // Delay helper for retries
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DVSAScraper;
