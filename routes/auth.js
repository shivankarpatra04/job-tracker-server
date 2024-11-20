const express = require('express');
const router = express.Router();
const {
    register,
    login,
    forgotPassword,
    resetPassword,
    getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log('Auth Route:', req.method, req.url);
    next();
});

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;