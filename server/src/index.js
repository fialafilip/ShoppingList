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
import sendNotification from './routes/push.js';

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
            user.pendingSetup = false;
            await user.save();
          } else {
            // Vytvoříme nového uživatele
            user = await User.create({
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos[0].value,
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
    const user = await User.findById(id);
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

// Socket.io
io.use((socket, next) => {
  console.log('Socket middleware - new connection attempt');
  next();
});

const activeUsers = new Map(); // userId -> socketId
const activeShops = new Map(); // shopId -> Set of userIds

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinShop', ({ shopId, userId }) => {
    console.log(`User ${userId} joining shop ${shopId}`);
    socket.join(shopId);
    console.log('Current rooms:', socket.rooms);
  });

  socket.on('itemChange', async (data) => {
    console.log('Item change received:', data); // Pro ověření dat

    socket.to(data.shopId).emit('itemChange', {
      type: data.type,
      item: data.item,
      userId: data.userId,
    });

    try {
      if (data.shopId) {
        const shop = await Shop.findById(data.shopId);
        console.log('Found shop:', shop); // Pro ověření shopu

        if (shop && shop.familyId) {
          const family = await Family.findById(shop.familyId).populate('members', 'userId');

          if (family) {
            for (const member of family.members) {
              if (member.userId.toString() !== data.userId) {
                const message = `${data.userName || 'Někdo'} ${data.type === 'added' ? 'přidal(a)' : 'upravil(a)'} položku ${data.item.name}`;
                await sendNotification(member.userId, message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in notification process:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-list')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
