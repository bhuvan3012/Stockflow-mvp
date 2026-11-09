const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    quantityOnHand: {
      type: Number,
      required: [true, 'Quantity on hand is required'],
      default: 0,
      min: [0, 'Quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer quantity',
      },
    },
    costPrice: {
      type: Number,
      default: null,
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      default: null,
      min: [0, 'Selling price cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: null,
      min: [0, 'Threshold cannot be negative'],
      validate: {
        validator: function (v) {
          return v === null || Number.isInteger(v);
        },
        message: '{VALUE} must be an integer threshold',
      },
    },
    lastUpdatedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique SKU per Organization
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
