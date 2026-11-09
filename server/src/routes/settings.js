const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    return res.json({
      defaultLowStockThreshold: org.defaultLowStockThreshold ?? 5,
      organizationName: org.name,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve settings.' });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const { defaultLowStockThreshold, organizationName } = req.body;

    const org = await Organization.findById(req.organizationId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    if (defaultLowStockThreshold !== undefined) {
      const parsed = parseInt(defaultLowStockThreshold, 10);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ message: 'Default low stock threshold must be a non-negative integer.' });
      }
      org.defaultLowStockThreshold = parsed;
    }

    if (organizationName && organizationName.trim()) {
      org.name = organizationName.trim();
    }

    await org.save();

    return res.json({
      message: 'Settings updated successfully.',
      defaultLowStockThreshold: org.defaultLowStockThreshold,
      organizationName: org.name,
    });
  } catch (err) {
    console.error('Settings update error:', err);
    return res.status(500).json({ message: 'Failed to update settings.' });
  }
});

module.exports = router;
