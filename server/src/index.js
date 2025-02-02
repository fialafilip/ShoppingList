// server/src/index.js

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createServer } from "http";
import { Server } from "socket.io";

// Import modelů
import User from "./models/User.js";
import "./models/Family.js";
import "./models/Shop.js";

// Import routes
import authRoutes from "./routes/auth.js";
import shopRoutes from "./routes/shops.js";
import familyRoutes from "./routes/family.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
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
      callbackURL: "http://localhost:5000/auth/google/callback",
      // Přidáme tyto řádky
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
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
        console.error("Google auth error:", error); // Pro debugging
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
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/family", familyRoutes);

const activeUsers = new Map(); // userId -> socketId
const activeShops = new Map(); // shopId -> Set of userIds

// Socket.io
io.on("connection", (socket) => {
  console.log("Client connected");

  // Přihlášení uživatele
  socket.on("userConnected", (userId) => {
    activeUsers.set(userId, socket.id);
    io.emit("activeUsers", Array.from(activeUsers.keys()));
  });

  // Připojení k obchodu
  socket.on("joinShop", ({ shopId, userId }) => {
    socket.join(shopId);

    if (!activeShops.has(shopId)) {
      activeShops.set(shopId, new Set());
    }
    activeShops.get(shopId).add(userId);

    // Informovat ostatní o novém uživateli
    io.to(shopId).emit("shopUsers", {
      shopId,
      users: Array.from(activeShops.get(shopId)),
    });
  });

  // Někdo začal upravovat položku
  socket.on("startEditing", ({ shopId, itemId, userId }) => {
    socket.to(shopId).emit("userEditing", { itemId, userId });
  });

  // Někdo přestal upravovat položku
  socket.on("stopEditing", ({ shopId, itemId }) => {
    socket.to(shopId).emit("userStoppedEditing", { itemId });
  });

  // Změny v položkách
  socket.on("itemChanged", ({ shopId, type, data, userId }) => {
    socket.to(shopId).emit("itemUpdate", { type, data, userId });
  });

  // Odpojení
  socket.on("disconnect", () => {
    let userId;
    for (const [uid, sid] of activeUsers.entries()) {
      if (sid === socket.id) {
        userId = uid;
        break;
      }
    }

    if (userId) {
      activeUsers.delete(userId);
      // Odstranit uživatele ze všech aktivních obchodů
      for (const [shopId, users] of activeShops.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(shopId).emit("shopUsers", {
            shopId,
            users: Array.from(users),
          });
        }
      }
      io.emit("activeUsers", Array.from(activeUsers.keys()));
    }
  });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shopping-list")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

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
