const logger = require('./logger');

class Notifier {
  constructor(config = {}) {
    this.config = config;
    this.soundEnabled = config.sound_alert !== false;
    this.pushEnabled = config.push_notification !== false;
    this.desktopNotificationEnabled = config.desktop_notification !== false;
  }

  sendDesktopNotification(title, options = {}) {
    if (!this.desktopNotificationEnabled) return;

    try {
      const notification = {
        title: title,
        options: {
          body: options.body || 'DVSA Slot Available!',
          icon: 'https://dvsa.gov.uk/favicon.ico',
          badge: 'https://dvsa.gov.uk/favicon.ico',
          tag: 'dvsa-slot-alert',
          requireInteraction: true,
          timestamp: Date.now(),
          ...options
        }
      };

      logger.success('Desktop Notification Sent', notification);
      return notification;
    } catch (error) {
      logger.error('Failed to send desktop notification', { error: error.message });
    }
  }

  playSoundAlert() {
    if (!this.soundEnabled) return;

    try {
      logger.info('Sound alert triggered');
      return `
        (function() {
          try {
            const audioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new audioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
          } catch(e) {
            console.error('Audio error:', e);
          }
        })();
      `;
    } catch (error) {
      logger.error('Failed to play sound alert', { error: error.message });
    }
  }

  sendPushNotification(slot) {
    if (!this.pushEnabled) return;

    try {
      const message = {
        title: '🎉 DVSA Slot Available!',
        body: `${slot.center} - ${slot.date} at ${slot.time}`,
        tag: 'dvsa-slot',
        requireInteraction: true,
        data: {
          url: 'https://dvsa.gov.uk',
          center: slot.center,
          date: slot.date,
          time: slot.time
        }
      };

      logger.success('Push Notification Sent', message);
      return message;
    } catch (error) {
      logger.error('Failed to send push notification', { error: error.message });
    }
  }

  notifySlotFound(slot) {
    logger.success(`SLOT FOUND: ${slot.center} on ${slot.date} at ${slot.time}`);

    this.sendDesktopNotification(
      `✅ Slot Available at ${slot.center}`,
      {
        body: `Date: ${slot.date} | Time: ${slot.time}`,
        requireInteraction: true
      }
    );

    this.sendPushNotification(slot);
    this.playSoundAlert();
  }
}

module.exports = Notifier;
