const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getProfile,
    getJobApplications,  // Add this new controller
} = require('../controllers/profileController');

// Get profile data
router.get('/me', protect, getProfile);

// Get job applications
router.get('/applications', protect, getJobApplications);

module.exports = router;