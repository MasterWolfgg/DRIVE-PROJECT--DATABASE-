const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userModel = require('../models/user.model');

/* ───────────────────────── REGISTER ───────────────────────── */
router.get('/register', (req, res) => {
  res.render('register');
});

router.post(
  '/register',
  body('username').trim().isLength({ min: 3 }),
  body('email').trim().isEmail().isLength({ min: 5 }),
  body('password').trim().isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    const { email, username, password } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render('register', {
        error: 'Please fill all fields correctly.',
        oldInput: { email, username }
      });
    }

    try {
      const hashPassword = await bcrypt.hash(password, 10);
      await userModel.create({ email, username, password: hashPassword });
      res.render('index'); // Success: Go to landing
    } catch (err) {
      console.error('Error registering user:', err);

      // Likely duplicate email or database issue
      res.status(500).render('register', {
        error: 'Registration failed. Please try again.',
        oldInput: { email, username }
      });
    }
  }
);

/* ───────────────────────── LOGIN ───────────────────────── */
router.get('/login', (req, res) => {
  res.render('login');
});

router.post(
  '/login',
  body('username').trim().isLength({ min: 3 }),
  body('password').trim().isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    const { username, password } = req.body;

    if (!errors.isEmpty()) {
      return res.render('login', {
        error: 'Please enter valid credentials.',
        oldInput: req.body
      });
    }

    const user = await userModel.findOne({ username });

    if (!user) {
      return res.render('login', {
        error: 'Username or password is incorrect.',
        oldInput: req.body
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        error: 'Username or password is incorrect.',
        oldInput: req.body
      });
    }

    // 🔐 JWT creation
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000,
    });

    res.redirect('/home');
  }
);

/* ───────────────────────── LOGOUT ───────────────────────── */
router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'Strict',
    secure: process.env.NODE_ENV === 'production'
  });
  res.redirect('/');
});

module.exports = router;
