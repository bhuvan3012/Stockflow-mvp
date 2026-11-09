const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const authMiddleware = require('../middleware/auth');

const generateToken = (userId, organizationId) => {
  return jwt.sign(
    { userId, organizationId },
    process.env.JWT_SECRET || 'stockflow_super_secret_jwt_key_2026_wexa',
    { expiresIn: '7d' }
  );
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, confirmPassword, organizationName } = req.body;

    if (!email || !password || !organizationName) {
      return res.status(400).json({ message: 'Email, password, and organization name are required.' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Create Organization (FR-2: Organization context)
    const organization = await Organization.create({
      name: organizationName.trim(),
      defaultLowStockThreshold: 5,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User linked to Organization
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      organizationId: organization._id,
    });

    const token = generateToken(user._id, organization._id);

    return res.status(201).json({
      message: 'Account and organization created successfully.',
      token,
      user: {
        id: user._id,
        email: user.email,
        organization: {
          id: organization._id,
          name: organization.name,
          defaultLowStockThreshold: organization.defaultLowStockThreshold,
        },
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: err.message || 'Server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('organizationId');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id, user.organizationId._id);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        email: user.email,
        organization: {
          id: user.organizationId._id,
          name: user.organizationId.name,
          defaultLowStockThreshold: user.organizationId.defaultLowStockThreshold,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: err.message || 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    return res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        organization: {
          id: req.organization._id,
          name: req.organization.name,
          defaultLowStockThreshold: req.organization.defaultLowStockThreshold,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving user details.' });
  }
});

module.exports = router;
