const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// Protect all product routes with auth & organization scoping
router.use(authMiddleware);

// Helper function to check if product is low stock
const checkIsLowStock = (product, defaultThreshold = 5) => {
  const effectiveThreshold =
    product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
      ? product.lowStockThreshold
      : defaultThreshold;
  return product.quantityOnHand <= effectiveThreshold;
};

// GET /api/products (List products scoped to tenant with search filter)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { organizationId: req.organizationId };

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { sku: regex }];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    const defaultThreshold = req.organization?.defaultLowStockThreshold ?? 5;

    const formattedProducts = products.map((p) => {
      const isLowStock = checkIsLowStock(p, defaultThreshold);
      const effectiveThreshold =
        p.lowStockThreshold !== null && p.lowStockThreshold !== undefined
          ? p.lowStockThreshold
          : defaultThreshold;
      return {
        ...p.toObject(),
        effectiveThreshold,
        isLowStock,
      };
    });

    return res.json({ products: formattedProducts });
  } catch (err) {
    console.error('Fetch products error:', err);
    return res.status(500).json({ message: 'Failed to retrieve products.' });
  }
});

// GET /api/products/:id (Get single product scoped to tenant)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const defaultThreshold = req.organization?.defaultLowStockThreshold ?? 5;
    const isLowStock = checkIsLowStock(product, defaultThreshold);
    const effectiveThreshold =
      product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
        ? product.lowStockThreshold
        : defaultThreshold;

    return res.json({
      product: {
        ...product.toObject(),
        effectiveThreshold,
        isLowStock,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve product details.' });
  }
});

// POST /api/products (Create product scoped to tenant with unique SKU check)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      quantityOnHand,
      costPrice,
      sellingPrice,
      lowStockThreshold,
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Product name is required.' });
    }

    if (!sku || sku.trim() === '') {
      return res.status(400).json({ message: 'SKU is required.' });
    }

    const parsedQty = parseInt(quantityOnHand, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return res.status(400).json({ message: 'Quantity on hand must be a non-negative integer.' });
    }

    // Check SKU uniqueness within this organization
    const existingSku = await Product.findOne({
      organizationId: req.organizationId,
      sku: sku.trim().toUpperCase(),
    });

    if (existingSku) {
      return res.status(409).json({ message: `SKU "${sku.trim().toUpperCase()}" already exists in your organization.` });
    }

    const product = await Product.create({
      organizationId: req.organizationId,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      description: description ? description.trim() : '',
      quantityOnHand: parsedQty,
      costPrice: costPrice !== '' && costPrice !== null && !isNaN(Number(costPrice)) ? Number(costPrice) : null,
      sellingPrice: sellingPrice !== '' && sellingPrice !== null && !isNaN(Number(sellingPrice)) ? Number(sellingPrice) : null,
      lowStockThreshold:
        lowStockThreshold !== '' && lowStockThreshold !== null && !isNaN(parseInt(lowStockThreshold, 10))
          ? parseInt(lowStockThreshold, 10)
          : null,
      lastUpdatedBy: req.user.email,
    });

    const defaultThreshold = req.organization?.defaultLowStockThreshold ?? 5;
    const isLowStock = checkIsLowStock(product, defaultThreshold);

    return res.status(201).json({
      message: 'Product created successfully.',
      product: {
        ...product.toObject(),
        effectiveThreshold:
          product.lowStockThreshold !== null ? product.lowStockThreshold : defaultThreshold,
        isLowStock,
      },
    });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create product.' });
  }
});

// PUT /api/products/:id (Update product scoped to tenant)
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      quantityOnHand,
      costPrice,
      sellingPrice,
      lowStockThreshold,
    } = req.body;

    const product = await Product.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (name) product.name = name.trim();

    if (sku) {
      const normalizedSku = sku.trim().toUpperCase();
      if (normalizedSku !== product.sku) {
        const duplicate = await Product.findOne({
          organizationId: req.organizationId,
          sku: normalizedSku,
          _id: { $ne: product._id },
        });
        if (duplicate) {
          return res.status(409).json({ message: `SKU "${normalizedSku}" is already taken by another product.` });
        }
        product.sku = normalizedSku;
      }
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    if (quantityOnHand !== undefined) {
      const parsedQty = parseInt(quantityOnHand, 10);
      if (isNaN(parsedQty) || parsedQty < 0) {
        return res.status(400).json({ message: 'Quantity on hand must be a non-negative integer.' });
      }
      product.quantityOnHand = parsedQty;
    }

    if (costPrice !== undefined) {
      product.costPrice =
        costPrice !== '' && costPrice !== null && !isNaN(Number(costPrice)) ? Number(costPrice) : null;
    }

    if (sellingPrice !== undefined) {
      product.sellingPrice =
        sellingPrice !== '' && sellingPrice !== null && !isNaN(Number(sellingPrice)) ? Number(sellingPrice) : null;
    }

    if (lowStockThreshold !== undefined) {
      product.lowStockThreshold =
        lowStockThreshold !== '' && lowStockThreshold !== null && !isNaN(parseInt(lowStockThreshold, 10))
          ? parseInt(lowStockThreshold, 10)
          : null;
    }

    product.lastUpdatedBy = req.user.email;
    await product.save();

    const defaultThreshold = req.organization?.defaultLowStockThreshold ?? 5;
    const isLowStock = checkIsLowStock(product, defaultThreshold);

    return res.json({
      message: 'Product updated successfully.',
      product: {
        ...product.toObject(),
        effectiveThreshold:
          product.lowStockThreshold !== null ? product.lowStockThreshold : defaultThreshold,
        isLowStock,
      },
    });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update product.' });
  }
});

// POST /api/products/:id/adjust-stock (FR-5: Quick stock delta +/- N)
router.post('/:id/adjust-stock', async (req, res) => {
  try {
    const { delta, note } = req.body;

    const parsedDelta = parseInt(delta, 10);
    if (isNaN(parsedDelta) || parsedDelta === 0) {
      return res.status(400).json({ message: 'Delta must be a non-zero integer (e.g. +5 or -2).' });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const newQuantity = product.quantityOnHand + parsedDelta;
    if (newQuantity < 0) {
      return res.status(400).json({
        message: `Cannot adjust stock: current stock is ${product.quantityOnHand}, adjustment of ${parsedDelta} would result in negative quantity.`,
      });
    }

    product.quantityOnHand = newQuantity;
    product.lastUpdatedBy = `${req.user.email}${note ? ` (Note: ${note.trim()})` : ''}`;
    await product.save();

    const defaultThreshold = req.organization?.defaultLowStockThreshold ?? 5;
    const isLowStock = checkIsLowStock(product, defaultThreshold);

    return res.json({
      message: `Stock adjusted by ${parsedDelta > 0 ? `+${parsedDelta}` : parsedDelta} units. New quantity: ${newQuantity}.`,
      product: {
        ...product.toObject(),
        effectiveThreshold:
          product.lowStockThreshold !== null ? product.lowStockThreshold : defaultThreshold,
        isLowStock,
      },
    });
  } catch (err) {
    console.error('Stock adjustment error:', err);
    return res.status(500).json({ message: 'Failed to adjust stock.' });
  }
});

// DELETE /api/products/:id (Delete product scoped to tenant)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.json({ message: `Product "${product.name}" deleted successfully.` });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ message: 'Failed to delete product.' });
  }
});

module.exports = router;

