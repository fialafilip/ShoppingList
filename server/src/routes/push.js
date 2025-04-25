import express from 'express';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config(); // Přidáme načtení .env

const router = express.Router();

// Přidáme kontrolu
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('[PUSH] VAPID keys are not set in .env, push notifications will be disabled');
}

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:your@email.com', // Nastavte váš email
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Uložení subscriptions (v produkci by mělo být v databázi)
const subscriptions = new Map();

router.get('/vapidPublicKey', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(501).json({ error: 'Push notifications are not configured' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', (req, res) => {
  const subscription = req.body;
  const userId = req.user?._id;

  if (!userId) {
    console.error('[PUSH] No user ID found');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  subscriptions.set(userId.toString(), subscription);
  console.log('[PUSH] Subscription saved for user:', userId);

  res.status(201).json({});
});

export const sendNotification = async (userId, message) => {
  // If push notifications are not configured, just log and return
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('[PUSH] Notification would be sent (disabled):', { userId, message });
    return;
  }

  const subscription = subscriptions.get(userId);
  if (!subscription) {
    console.log('[PUSH] No subscription found for user:', userId);
    return;
  }

  try {
    const payload = JSON.stringify({
      title: 'Nákupní Seznam',
      body: message,
    });

    await webpush.sendNotification(subscription, payload);
    console.log('[PUSH] Notification sent successfully to user:', userId);
  } catch (error) {
    console.error('[PUSH] Error sending notification:', error);
    if (error.statusCode === 410) {
      // Subscription has expired or is invalid
      console.log('[PUSH] Removing invalid subscription for user:', userId);
      subscriptions.delete(userId);
    }
    throw error; // Re-throw the error to be handled by the caller
  }
};

export default router;
