// server/src/routes/family.js
import express from "express";
import { Types } from "mongoose";
import User from "../models/User.js";
import Family from "../models/Family.js";

const router = express.Router();

// Middleware pro ověření přihlášení
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware pro ověření admin práv
const isAdmin = async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.familyId);
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    const member = family.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    if (!member || member.role !== "admin") {
      return res.status(403).json({ message: "Admin rights required" });
    }

    req.family = family;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Získat všechny rodiny uživatele
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const families = await Family.find({
      "members.userId": req.user._id,
    })
      .populate("members.userId", "name email picture")
      .populate("createdBy", "name email");

    res.json(families);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Vytvořit novou rodinu
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const family = new Family({
      name: req.body.name,
      members: [
        {
          userId: req.user._id,
          role: "admin",
        },
      ],
      createdBy: req.user._id,
    });

    await family.save();
    res.status(201).json(family);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Přidat člena do rodiny
router.post(
  "/:familyId/members",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      // Nejdřív zkusíme najít existujícího uživatele
      let user = await User.findOne({ email: req.body.email });

      if (!user) {
        // Pokud uživatel neexistuje, vytvoříme nový záznam
        user = await User.create({
          email: req.body.email,
          name: req.body.email.split("@")[0], // Základní jméno z emailu
          pendingSetup: true, // Označíme, že se ještě musí přihlásit
        });
      }

      // Kontrola, zda už není členem rodiny
      const isAlreadyMember = req.family.members.some(
        (m) => m.userId.toString() === user._id.toString()
      );

      if (isAlreadyMember) {
        return res
          .status(400)
          .json({ message: "Uživatel je již členem rodiny" });
      }

      // Přidat do rodiny
      req.family.members.push({
        userId: user._id,
        role: req.body.role || "member",
      });

      await req.family.save();

      const populatedFamily = await Family.findById(req.family._id).populate(
        "members.userId",
        "name email picture"
      );

      res.json(populatedFamily);
    } catch (error) {
      console.error("Error adding family member:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Změnit roli člena
router.patch(
  "/:familyId/members/:userId/role",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const member = req.family.members.find(
        (m) => m.userId.toString() === req.params.userId
      );

      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Zabrání odstranění posledního admina
      const adminCount = req.family.members.filter(
        (m) => m.role === "admin"
      ).length;
      if (member.role === "admin" && adminCount === 1) {
        return res.status(400).json({ message: "Cannot remove last admin" });
      }

      member.role = req.body.role;
      await req.family.save();

      const populatedFamily = await Family.findById(req.family._id).populate(
        "members.userId",
        "name email picture"
      );

      res.json(populatedFamily);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Odstranit člena
router.delete(
  "/:familyId/members/:userId",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      // Kontrola, zda se nejedná o posledního admina
      if (req.params.userId === req.user._id.toString()) {
        const adminCount = req.family.members.filter(
          (m) => m.role === "admin"
        ).length;
        if (adminCount === 1) {
          return res.status(400).json({ message: "Cannot remove last admin" });
        }
      }

      req.family.members = req.family.members.filter(
        (m) => m.userId.toString() !== req.params.userId
      );

      await req.family.save();
      res.json({ message: "Member removed" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;
