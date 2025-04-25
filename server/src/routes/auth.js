import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import Family from '../models/Family.js';

const router = express.Router();

// Google Auth routes
router.get(
  '/google',
  (req, res, next) => {
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
    next();
  },
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true,
  }),
  (req, res) => {
    res.redirect('http://localhost:5173');
  }
);

// Get current user
router.get('/user', async (req, res) => {
  if (!req.user) {
    return res.json(null);
  }

  const user = await User.findById(req.user._id).populate('currentFamilyId');
  res.json(user);
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
        pendingSetup: true,
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

// Complete setup
router.post('/complete-setup', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await User.findById(req.user._id);
    user.pendingSetup = false;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Complete setup error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
