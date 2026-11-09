const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const defaultThreshold = req.organization.defaultLowStockThreshold ?? 5;

    // Fetch all products for the tenant
    const products = await Product.find({ organizationId: req.organizationId }).sort({ quantityOnHand: 1 });

    const totalProducts = products.length;
    let totalQuantity = 0;
    const lowStockItems = [];

    products.forEach((product) => {
      totalQuantity += product.quantityOnHand || 0;

      const threshold =
        product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
          ? product.lowStockThreshold
          : defaultThreshold;

      if (product.quantityOnHand <= threshold) {
        lowStockItems.push({
          _id: product._id,
          name: product.name,
          sku: product.sku,
          quantityOnHand: product.quantityOnHand,
          lowStockThreshold: threshold,
          sellingPrice: product.sellingPrice,
        });
      }
    });

    return res.json({
      organization: {
        id: req.organization._id,
        name: req.organization.name,
        defaultLowStockThreshold: defaultThreshold,
      },
      stats: {
        totalProducts,
        totalQuantity,
        lowStockCount: lowStockItems.length,
      },
      lowStockItems,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard metrics.' });
  }
});

module.exports = router;
