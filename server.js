#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const logger = require('./utils/logger');
const DVSAScraper = require('./utils/dvsa-scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load configuration
const centers = JSON.parse(fs.readFileSync('./config/centers.json', 'utf8')).london_centers;
const settings = JSON.parse(fs.readFileSync('./config/settings.json', 'utf8'));

const scraper = new DVSAScraper({
  timeout: settings.monitoring.timeout_ms,
  retries: settings.monitoring.max_retries,
  retryDelay: settings.monitoring.retry_delay_ms
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get all configured centres
app.get('/api/centers', (req, res) => {
  res.json({ centers });
});

// Check slots for a specific centre
app.get('/api/check/:centerId', async (req, res) => {
  try {
    const { centerId } = req.params;
    const testType = req.query.type || 'car';

    logger.info(`API: Checking slots for centre ${centerId}`);

    const slots = await scraper.checkSlots(centerId, testType);

    res.json({
      centerId,
      testType,
      slots: slots || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('API error', { error: error.message });
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Check all centres
app.get('/api/check-all', async (req, res) => {
  try {
    logger.info('API: Checking all centres');

    const { results, availableSlots } = await scraper.checkAllCenters(centers);

    res.json({
      total_centers: centers.length,
      centers_with_slots: availableSlots.length,
      available_slots: availableSlots,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('API error', { error: error.message });
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get logs
app.get('/api/logs', (req, res) => {
  try {
    const logsDir = './logs';
    if (!fs.existsSync(logsDir)) {
      return res.json({ logs: [] });
    }

    const files = fs.readdirSync(logsDir);
    const latestLog = files.sort().reverse()[0];

    if (!latestLog) {
      return res.json({ logs: [] });
    }

    const logContent = fs.readFileSync(path.join(logsDir, latestLog), 'utf8');
    const logs = logContent.split('\n').filter(l => l.trim());

    res.json({
      file: latestLog,
      total_lines: logs.length,
      logs: logs.slice(-100) // Last 100 lines
    });
  } catch (error) {
    logger.error('Logs API error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Settings endpoint
app.get('/api/settings', (req, res) => {
  res.json({ settings });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Express error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.success(`🚀 DVSA Monitor Web Server running on http://localhost:${PORT}`);
  logger.info('Web Interface available at http://localhost:3000/index.html');
  logger.info('API endpoints available at http://localhost:3000/api/*');
});
