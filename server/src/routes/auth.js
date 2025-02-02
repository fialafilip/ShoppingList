import express from 'express';
import passport from 'passport';
import User from '../models/User.js';

const router = express.Router();

// Google Auth routes
router.get(
  '/google',
  (req, res, next) => {
    console.log('Starting Google auth...');
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
  })
);

router.get(
  '/google/callback',
  (req, res, next) => {
    console.log('Received callback from Google');
    next();
  },
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true,
  }),
  (req, res) => {
    console.log('Authentication successful');
    res.redirect('http://localhost:5173');
  }
);

// Get current user
router.get('/user', (req, res) => {
  res.json(req.user || null);
});

// Test login pro vývoj
router.post('/test-login', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'test@example.com' });

    if (!user) {
      user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'test123',
      });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      return res.json(user);
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json({ message: 'Logged out' });
  });
});

export default router;
