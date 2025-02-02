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

    if (shop.familyId.toString() !== req.user.currentFamilyId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await shop.deleteOne();
    res.json({ message: 'Shop deleted' });
  } catch (error) {
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

// Update item in shop
router.patch('/:shopId/items/:itemId', isAuthenticated, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const item = shop.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (req.body.completed !== undefined) item.completed = req.body.completed;
    if (req.body.name) item.name = req.body.name;

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
