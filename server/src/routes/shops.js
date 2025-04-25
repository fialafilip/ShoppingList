import express from 'express';
import Shop from '../models/Shop.js';
const router = express.Router();

// Middleware pro kontrolu přihlášení
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Get all shops for family
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const shops = await Shop.find({ familyId: req.user.currentFamilyId });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new shop
router.post('/', isAuthenticated, async (req, res) => {
  const shop = new Shop({
    name: req.body.name,
    icon: req.body.icon,
    familyId: req.user.currentFamilyId,
  });

  try {
    const newShop = await shop.save();
    res.status(201).json(newShop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update shop
router.patch('/:id', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    // if (shop.familyId.toString() !== req.user.currentFamilyId.toString()) {
    //   return res.status(403).json({ message: "Forbidden" });
    // }

    if (req.body.name) shop.name = req.body.name;
    if (req.body.icon) shop.icon = req.body.icon;

    const updatedShop = await shop.save();
    res.json(updatedShop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete shop
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    console.log('Delete shop attempt:', {
      shopFamilyId: shop.familyId,
      userFamilyId: req.user.currentFamilyId,
      shopFamilyIdType: typeof shop.familyId,
      userFamilyIdType: typeof req.user.currentFamilyId,
    });

    // Extract the actual ID value from the currentFamilyId object
    const userFamilyId = req.user.currentFamilyId._id || req.user.currentFamilyId;
    const shopFamilyId = shop.familyId;

    if (!shopFamilyId || !userFamilyId || shopFamilyId.toString() !== userFamilyId.toString()) {
      console.log('Forbidden - family ID mismatch:', {
        shopFamilyId: shopFamilyId?.toString(),
        userFamilyId: userFamilyId?.toString(),
      });
      return res.status(403).json({
        message: 'Forbidden',
        debug: {
          shopFamilyId: shopFamilyId?.toString(),
          userFamilyId: userFamilyId?.toString(),
        },
      });
    }

    await Shop.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shop deleted' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get items for a shop
router.get('/:shopId/items', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop.items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add item to shop
router.post('/:shopId/items', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    shop.items.push({
      name: req.body.name,
      completed: false,
      addedBy: req.user._id,
    });

    await shop.save();
    res.status(201).json(shop.items[shop.items.length - 1]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Lock item
router.post('/:shopId/items/:itemId/lock', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const item = shop.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Check if item is already locked by someone else
    if (item.lockedBy && item.lockedBy.toString() !== req.user._id.toString()) {
      // Check if lock has expired (5 minutes)
      const lockExpired = new Date() - new Date(item.lockedAt) > 5 * 60 * 1000;
      if (!lockExpired) {
        return res.status(423).json({
          message: 'Item is locked by another user',
          lockedBy: item.lockedByName,
        });
      }
    }

    // Set or update lock
    item.lockedBy = req.user._id;
    item.lockedAt = new Date();
    item.lockedByName = req.user.name;

    await shop.save();

    res.json(item);
  } catch (error) {
    console.error('Lock error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Unlock item
router.post('/:shopId/items/:itemId/unlock', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const item = shop.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Only the user who locked it can unlock it (unless lock expired)
    if (item.lockedBy && item.lockedBy.toString() !== req.user._id.toString()) {
      const lockExpired = new Date() - new Date(item.lockedAt) > 5 * 60 * 1000;
      if (!lockExpired) {
        return res.status(403).json({ message: 'Not authorized to unlock this item' });
      }
    }

    // Remove lock
    item.lockedBy = null;
    item.lockedAt = null;
    item.lockedByName = null;

    await shop.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update item in shop
router.patch('/:shopId/items/:itemId', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const item = shop.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Check if item is locked by someone else
    if (item.lockedBy && item.lockedBy.toString() !== req.user._id.toString()) {
      const lockExpired = new Date() - new Date(item.lockedAt) > 5 * 60 * 1000;
      if (!lockExpired) {
        return res.status(423).json({
          message: 'Item is locked by another user',
          lockedBy: item.lockedByName,
        });
      }
    }

    // Update item fields
    if (req.body.completed !== undefined) item.completed = req.body.completed;
    if (req.body.name) item.name = req.body.name;
    if (req.body.quantity) item.quantity = req.body.quantity;
    if (req.body.unit) item.unit = req.body.unit;
    if (req.body.order !== undefined) item.order = req.body.order;

    // Remove lock after update
    item.lockedBy = null;
    item.lockedAt = null;
    item.lockedByName = null;

    await shop.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete item from shop
router.delete('/:shopId/items/:itemId', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    shop.items = shop.items.filter((item) => item._id.toString() !== req.params.itemId);
    await shop.save();

    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reorder item in shop
router.patch('/:shopId/items/:itemId/reorder', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const { order } = req.body;
    const items = shop.items;
    const itemIndex = items.findIndex((item) => item._id.toString() === req.params.itemId);

    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });

    // Přesuneme položku na novou pozici
    const [item] = items.splice(itemIndex, 1);
    items.splice(order, 0, item);

    // Aktualizujeme order hodnoty pro všechny položky
    items.forEach((item, index) => {
      item.order = index;
    });

    await shop.save();
    res.json(shop.items);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
