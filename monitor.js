#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// ============================================================================
// DVSA SLOT MONITOR - Main Monitoring Script
// ============================================================================
// This script continuously monitors DVSA UK driving test slots for 9 London
// test centres and alerts when slots become available.
// ============================================================================

const logger = require('./utils/logger');
const DVSAScraper = require('./utils/dvsa-scraper');
const Notifier = require('./utils/notifier');

// Load configuration
const centers = JSON.parse(fs.readFileSync('./config/centers.json', 'utf8')).london_centers;
const settings = JSON.parse(fs.readFileSync('./config/settings.json', 'utf8'));

class DVSAMonitor {
  constructor() {
    this.scraper = new DVSAScraper({
      timeout: settings.monitoring.timeout_ms,
      retries: settings.monitoring.max_retries,
      retryDelay: settings.monitoring.retry_delay_ms
    });

    this.notifier = new Notifier({
      sound_alert: settings.notifications.sound_alert,
      push_notification: settings.notifications.browser_push,
      desktop_notification: settings.notifications.desktop_notification
    });

    this.checkInterval = settings.monitoring.check_interval_ms;
    this.isRunning = false;
    this.foundSlots = new Map();
  }

  // Start continuous monitoring
  async start() {
    this.isRunning = true;
    logger.success('=== DVSA SLOT MONITOR STARTED ===');
    logger.info(`Monitoring ${centers.length} London test centres`);
    logger.info(`Check interval: ${this.checkInterval / 1000} seconds`);
    logger.info(`Next check in ${this.checkInterval / 1000} seconds\n`);

    // First check immediately
    await this.performCheck();

    // Then start interval
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.checkInterval);

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  // Perform a single check
  async performCheck() {
    const timestamp = new Date().toLocaleString();
    logger.info(`\n========== CHECK AT ${timestamp} ==========`);

    try {
      const { results, availableSlots } = await this.scraper.checkAllCenters(centers);

      if (availableSlots.length > 0) {
        logger.success(`✅ FOUND ${availableSlots.length} AVAILABLE SLOTS!`);

        availableSlots.forEach(item => {
          logger.success(`\n🎉 ${item.center}:`);
          item.slots.forEach((slot, idx) => {
            logger.success(`   Slot ${idx + 1}: ${slot.date} at ${slot.time}`);

            // Notify for each slot
            this.notifier.notifySlotFound({
              center: item.center,
              date: slot.date,
              time: slot.time
            });
          });
        });
      } else {
        logger.info('❌ No slots available at this time');
      }

      logger.info(`\n⏰ Next check in ${this.checkInterval / 1000} seconds`);
    } catch (error) {
      logger.error('Error during check', { error: error.message });
    }
  }

  // Stop monitoring
  stop() {
    logger.warn('Stopping monitor...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    logger.success('DVSA Slot Monitor stopped.');
    process.exit(0);
  }
}

// Start the monitor
const monitor = new DVSAMonitor();
monitor.start().catch(error => {
  logger.error('Fatal error', { error: error.message });
  process.exit(1);
});
