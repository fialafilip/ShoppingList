import express from 'express';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config(); // Přidáme načtení .env

const router = express.Router();

// Přidáme kontrolu
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error('VAPID keys must be set in .env');
  process.exit(1);
}

// VAPID klíče s logováním pro debug
console.log('Setting VAPID details with:', {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
});

webpush.setVapidDetails(
  'mailto:your@email.com', // Nastavte váš email
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Uložení subscriptions (v produkci by mělo být v databázi)
const subscriptions = new Map();

router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', (req, res) => {
  console.log('Received subscription request:', req.body);
  const subscription = req.body;
  const userId = req.user?._id;
  console.log('User ID:', userId);

  if (!userId) {
    console.error('No user ID found');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  subscriptions.set(userId, subscription);
  console.log('Subscription saved for user:', userId);
  res.status(201).json({});
});

export const sendNotification = async (userId, message) => {
  console.log('Sending notification to user:', userId);
  const subscription = subscriptions.get(userId);

  if (subscription) {
    try {
      const payload = JSON.stringify({
        title: 'Nákupní Seznam',
        body: message,
      });

      await webpush.sendNotification(subscription, payload);
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Push error:', error);
      if (error.statusCode === 410) {
        // Subscription has expired or is invalid
        subscriptions.delete(userId);
      }
    }
  }
};
export default router;
