// server/src/index.js

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import modelů
import User from './models/User.js';
import Family from './models/Family.js';
import Shop from './models/Shop.js';
import './models/Family.js';
import './models/Shop.js';

// Import routes
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shops.js';
import familyRoutes from './routes/family.js';
import pushRouter, { sendNotification } from './routes/push.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hodin
    },
  })
);

app.use((req, res, next) => {
  // console.log("Session:", req.session);
  // console.log("User:", req.user);
  next();
});

// Passport konfigurace
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/auth/google/callback',
      // Přidáme tyto řádky
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
      proxy: true,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Nejdřív hledáme podle Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Pokud nenajdeme podle Google ID, zkusíme podle emailu
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Pokud najdeme podle emailu, aktualizujeme Google ID
            user.googleId = profile.id;
            user.picture = profile.photos[0].value;
            await user.save();
          } else {
            // Vytvoříme nového uživatele
            user = await User.create({
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos[0].value,
              pendingSetup: true,
            });
          }
        }

        return done(null, user);
      } catch (error) {
        console.error('Google auth error:', error); // Pro debugging
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate('currentFamilyId');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/push', pushRouter);

// Socket.io
io.use((socket, next) => {
  console.log('[LOCK] Socket middleware - new connection attempt');
  const userId = socket.handshake.auth?.userId;

  if (!userId) {
    const error = new Error('Authentication error: No userId provided');
    error.data = { type: 'AUTH_ERROR' };
    console.error('[LOCK]', error.message);
    return next(error);
  }

  try {
    socket.userId = userId;
    console.log('[LOCK] Socket authenticated for user:', userId);
    next();
  } catch (error) {
    console.error('[LOCK] Socket middleware error:', error);
    next(new Error('Internal server error'));
  }
});

const activeUsers = new Map(); // userId -> socketId
const activeShops = new Map(); // shopId -> Set of userIds

io.on('connection', (socket) => {
  try {
    console.log('[LOCK] Client connected:', socket.id, 'User:', socket.userId);
    activeUsers.set(socket.userId, socket.id);

    socket.on('joinShop', ({ shopId, userId }) => {
      if (!shopId || !userId) {
        console.error('[LOCK] Invalid joinShop data:', { shopId, userId });
        return;
      }

      console.log('[LOCK] User joining shop:', { userId, shopId });
      if (!activeShops.has(shopId)) {
        activeShops.set(shopId, new Set());
      }
      activeShops.get(shopId).add(userId);
      socket.join(shopId);
      console.log('[LOCK] Active users in shop:', Array.from(activeShops.get(shopId)));
    });

    socket.on('itemChange', async (data) => {
      try {
        if (!data || !data.type || !data.item || !data.shopId || !data.userId) {
          console.error('[LOCK] Invalid itemChange data:', data);
          return;
        }

        console.log('[LOCK] Item change received:', {
          type: data.type,
          itemId: data.item._id,
          userId: data.userId,
          userName: data.userName,
        });

        // Ensure we have the userName
        const user = await User.findById(data.userId);
        const userName = data.userName || (user ? user.name : 'Someone');

        // Broadcast the change to all clients in the shop except the sender
        socket.to(data.shopId).emit('itemChange', {
          type: data.type,
          item: {
            ...data.item,
            userName: userName,
            lockedByName: userName,
          },
          userId: data.userId,
          userName: userName,
          shopId: data.shopId,
          familyId: data.familyId,
        });

        // Only process notifications for certain types of changes
        if (['added', 'updated', 'locked', 'unlocked'].includes(data.type)) {
          try {
            const shop = await Shop.findById(data.shopId);
            if (!shop) {
              console.error('[LOCK] Shop not found:', data.shopId);
              return;
            }

            if (!shop.familyId) {
              console.error('[LOCK] Shop has no familyId:', data.shopId);
              return;
            }

            const family = await Family.findById(shop.familyId).populate('members', 'userId');
            if (!family) {
              console.error('[LOCK] Family not found:', shop.familyId);
              return;
            }

            // Send notifications to other family members
            for (const member of family.members) {
              if (member.userId && member.userId.toString() !== data.userId) {
                let message;
                switch (data.type) {
                  case 'added':
                    message = `${userName} přidal(a) položku ${data.item.name}`;
                    break;
                  case 'updated':
                    message = `${userName} upravil(a) položku ${data.item.name}`;
                    break;
                  case 'locked':
                    message = `${userName} upravuje položku ${data.item.name}`;
                    break;
                  case 'unlocked':
                    message = `${userName} dokončil(a) úpravu položky ${data.item.name}`;
                    break;
                }
                if (message) {
                  try {
                    await sendNotification(member.userId.toString(), message).catch((error) => {
                      console.error('[LOCK] Notification error:', error);
                    });
                  } catch (notifError) {
                    console.error('[LOCK] Failed to send notification:', notifError);
                  }
                }
              }
            }
          } catch (dbError) {
            console.error('[LOCK] Database error:', dbError);
          }
        }
      } catch (error) {
        console.error('[LOCK] Error handling itemChange:', error);
      }
    });

    socket.on('disconnect', () => {
      try {
        console.log('[LOCK] Client disconnected:', socket.id);
        if (socket.userId) {
          activeUsers.delete(socket.userId);
          // Remove user from all shops they were in
          for (const [shopId, users] of activeShops.entries()) {
            if (users.has(socket.userId)) {
              users.delete(socket.userId);
              if (users.size === 0) {
                activeShops.delete(shopId);
              }
            }
          }
        }
      } catch (error) {
        console.error('[LOCK] Error handling disconnect:', error);
      }
    });
  } catch (error) {
    console.error('[LOCK] Error in connection handler:', error);
  }
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-list')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Logging middleware
app.use((req, res, next) => {
  next();
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
