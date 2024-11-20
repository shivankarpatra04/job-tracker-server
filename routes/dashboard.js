const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardStats, getRecentActivity, getActivityTimeline } = require('../controllers/dashboardController');

// Apply authentication middleware
router.use(protect);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);
router.get('/timeline', getActivityTimeline);

module.exports = router;