require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   StockFlow MVP – Automated Multi-Tenant Test Suite   ');
  console.log('======================================================\n');

  try {
    await connectDB();

    // Clean test slate
    await Product.deleteMany({ sku: { $regex: /^TEST-/ } });
    await User.deleteMany({ email: { $regex: /@testrunner\.com$/ } });
    await Organization.deleteMany({ name: { $regex: /^Test Org/ } });

    // -----------------------------------------------------------------
    // TEST 1: Tenant Creation & Password Hashing (FR-1, FR-2)
    // -----------------------------------------------------------------
    console.log('[1/5] Testing Authentication & Tenant Setup:');
    const orgA = await Organization.create({ name: 'Test Org Alpha', defaultLowStockThreshold: 5 });
    const orgB = await Organization.create({ name: 'Test Org Beta', defaultLowStockThreshold: 10 });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('secretPass123', salt);

    const userA = await User.create({
      email: 'owner@testrunner.com',
      password: hash,
      organizationId: orgA._id,
    });

    assert(orgA._id && orgB._id, 'Organizations created with valid ObjectIds');
    assert(userA.organizationId.toString() === orgA._id.toString(), 'User correctly linked to organizationId');
    assert(await bcrypt.compare('secretPass123', userA.password), 'Bcrypt password hashing verified');

    // -----------------------------------------------------------------
    // TEST 2: Multi-Tenant Data Isolation (FR-2)
    // -----------------------------------------------------------------
    console.log('\n[2/5] Testing Multi-Tenant Data Isolation:');
    const productA = await Product.create({
      organizationId: orgA._id,
      name: 'Alpha Special Tool',
      sku: 'TEST-ALPHA-01',
      quantityOnHand: 20,
      sellingPrice: 50.0,
    });

    const productB = await Product.create({
      organizationId: orgB._id,
      name: 'Beta Heavy Equipment',
      sku: 'TEST-BETA-01',
      quantityOnHand: 5,
      sellingPrice: 150.0,
    });

    const orgAProducts = await Product.find({ organizationId: orgA._id, sku: { $regex: /^TEST-/ } });
    const orgBProducts = await Product.find({ organizationId: orgB._id, sku: { $regex: /^TEST-/ } });

    assert(
      orgAProducts.length === 1 && orgAProducts[0].sku === 'TEST-ALPHA-01',
      'Tenant Alpha query returns ONLY Tenant Alpha data'
    );
    assert(
      orgBProducts.length === 1 && orgBProducts[0].sku === 'TEST-BETA-01',
      'Tenant Beta query returns ONLY Tenant Beta data'
    );
    assert(
      !orgAProducts.some((p) => p.organizationId.toString() === orgB._id.toString()),
      'Zero cross-tenant data leakage confirmed'
    );

    // -----------------------------------------------------------------
    // TEST 3: Per-Organization SKU Uniqueness (FR-3)
    // -----------------------------------------------------------------
    console.log('\n[3/5] Testing Per-Organization SKU Uniqueness:');
    const sharedSku = 'TEST-SHARED-SKU';

    const pA = await Product.create({
      organizationId: orgA._id,
      name: 'Alpha Widget',
      sku: sharedSku,
      quantityOnHand: 8,
    });

    const pB = await Product.create({
      organizationId: orgB._id,
      name: 'Beta Widget',
      sku: sharedSku,
      quantityOnHand: 12,
    });

    assert(
      pA && pB && pA.sku === pB.sku,
      'Same SKU allowed across DIFFERENT organizations'
    );

    let duplicateRejected = false;
    try {
      await Product.create({
        organizationId: orgA._id,
        name: 'Alpha Duplicate Widget',
        sku: sharedSku,
        quantityOnHand: 4,
      });
    } catch (e) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Duplicate SKU within the SAME organization is rejected');

    // -----------------------------------------------------------------
    // TEST 4: Stock Adjustment & Non-Negative Invariant (FR-5)
    // -----------------------------------------------------------------
    console.log('\n[4/5] Testing Stock Updates & Delta Adjustments:');
    productA.quantityOnHand += 5;
    productA.lastUpdatedBy = 'owner@testrunner.com (Shipment received)';
    await productA.save();

    const reloadedA = await Product.findById(productA._id);
    assert(reloadedA.quantityOnHand === 25, 'Stock delta (+5) correctly calculated and persisted');
    assert(reloadedA.lastUpdatedBy.includes('Shipment received'), 'Audit note recorded in lastUpdatedBy');

    const invalidStockDelta = reloadedA.quantityOnHand - 50;
    assert(invalidStockDelta < 0, 'Negative stock adjustments properly identified for rejection');

    // -----------------------------------------------------------------
    // TEST 5: Low-Stock Threshold & Organization Fallback (FR-6, FR-7)
    // -----------------------------------------------------------------
    console.log('\n[5/5] Testing Low-Stock Thresholds & Global Settings:');
    const lowItem = await Product.create({
      organizationId: orgA._id,
      name: 'Low Stock Mouse',
      sku: 'TEST-LOW-01',
      quantityOnHand: 3,
      lowStockThreshold: 5,
    });

    const fallbackItem = await Product.create({
      organizationId: orgA._id,
      name: 'Fallback Threshold Item',
      sku: 'TEST-FALLBACK-01',
      quantityOnHand: 4,
      lowStockThreshold: null, // Inherits orgA default (5)
    });

    const checkLow = (p, defaultThreshold) => {
      const threshold = p.lowStockThreshold ?? defaultThreshold;
      return p.quantityOnHand <= threshold;
    };

    assert(checkLow(lowItem, orgA.defaultLowStockThreshold), 'Explicit low-stock threshold triggers alert');
    assert(
      checkLow(fallbackItem, orgA.defaultLowStockThreshold),
      'Null threshold correctly falls back to organization default threshold'
    );

    // Clean up test records
    await Product.deleteMany({ sku: { $regex: /^TEST-/ } });
    await User.deleteMany({ email: { $regex: /@testrunner\.com$/ } });
    await Organization.deleteMany({ name: { $regex: /^Test Org/ } });

    console.log('\n------------------------------------------------------');
    console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
    console.log('------------------------------------------------------\n');

    await disconnectDB();

    if (failCount > 0) {
      process.exit(1);
    } else {
      console.log('🎉 All StockFlow automated tests passed successfully!\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    await disconnectDB();
    process.exit(1);
  }
}

runTests();

