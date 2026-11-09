require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('./config/db');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Product = require('./models/Product');

const seed = async () => {
  try {
    await connectDB();
    console.log('Clearing existing data...');
    await Product.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});

    console.log('Seeding organizations & users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Tenant 1: Acme Retail
    const acmeOrg = await Organization.create({
      name: 'Acme Retail Store',
      defaultLowStockThreshold: 5,
    });

    const acmeUser = await User.create({
      email: 'admin@acme.com',
      password: passwordHash,
      organizationId: acmeOrg._id,
    });

    // Products for Acme Retail
    await Product.create([
      {
        organizationId: acmeOrg._id,
        name: 'Wireless Ergonomic Mouse',
        sku: 'WEM-101',
        description: '2.4GHz rechargeable ergonomic vertical mouse with silent click',
        quantityOnHand: 3,
        costPrice: 14.50,
        sellingPrice: 29.99,
        lowStockThreshold: 5,
        lastUpdatedBy: acmeUser.email,
      },
      {
        organizationId: acmeOrg._id,
        name: 'Mechanical Gaming Keyboard',
        sku: 'MGK-202',
        description: 'RGB hot-swappable mechanical keyboard with blue switches',
        quantityOnHand: 22,
        costPrice: 38.00,
        sellingPrice: 79.99,
        lowStockThreshold: 5,
        lastUpdatedBy: acmeUser.email,
      },
      {
        organizationId: acmeOrg._id,
        name: 'USB-C Fast Charging Cable (2m)',
        sku: 'UCC-303',
        description: 'Braided 100W PD nylon USB-C to USB-C cable',
        quantityOnHand: 2,
        costPrice: 2.10,
        sellingPrice: 9.99,
        lowStockThreshold: 8,
        lastUpdatedBy: acmeUser.email,
      },
      {
        organizationId: acmeOrg._id,
        name: 'Noise-Cancelling Over-Ear Headphones',
        sku: 'NCH-404',
        description: 'Active noise cancellation with 40-hour battery life',
        quantityOnHand: 15,
        costPrice: 65.00,
        sellingPrice: 129.99,
        lowStockThreshold: 4,
        lastUpdatedBy: acmeUser.email,
      },
      {
        organizationId: acmeOrg._id,
        name: 'Aluminum Laptop Riser Stand',
        sku: 'LSA-505',
        description: 'Ventilated foldable desk stand for laptops up to 17 inches',
        quantityOnHand: 0,
        costPrice: 11.00,
        sellingPrice: 24.99,
        lowStockThreshold: 5,
        lastUpdatedBy: acmeUser.email,
      },
      {
        organizationId: acmeOrg._id,
        name: 'HD Webcam 1080p with Privacy Shutter',
        sku: 'HDC-606',
        description: 'Autofocus dual microphone streaming webcam',
        quantityOnHand: 7,
        costPrice: 19.50,
        sellingPrice: 39.99,
        lowStockThreshold: null, // Uses org default (5)
        lastUpdatedBy: acmeUser.email,
      },
    ]);

    // Tenant 2: Beta Logistics (Used to verify multi-tenant isolation!)
    const betaOrg = await Organization.create({
      name: 'Beta Logistics Corp',
      defaultLowStockThreshold: 10,
    });

    const betaUser = await User.create({
      email: 'demo@beta.com',
      password: passwordHash,
      organizationId: betaOrg._id,
    });

    await Product.create([
      {
        organizationId: betaOrg._id,
        name: 'Heavy Duty Thermal Shipping Labels',
        sku: 'BLC-001',
        description: '4x6 direct thermal fanfold label packs',
        quantityOnHand: 8,
        costPrice: 8.00,
        sellingPrice: 18.00,
        lowStockThreshold: 10,
        lastUpdatedBy: betaUser.email,
      },
      {
        organizationId: betaOrg._id,
        name: 'Handheld Bluetooth Barcode Scanner',
        sku: 'BLC-002',
        description: '1D/2D QR wireless scanner',
        quantityOnHand: 35,
        costPrice: 42.00,
        sellingPrice: 89.00,
        lowStockThreshold: 5,
        lastUpdatedBy: betaUser.email,
      },
    ]);

    console.log('✅ Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Accounts:');
    console.log('Tenant 1: admin@acme.com / password123 (Acme Retail)');
    console.log('Tenant 2: demo@beta.com  / password123 (Beta Logistics)');
    console.log('----------------------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
