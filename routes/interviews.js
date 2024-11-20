const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const interviewController = require('../controllers/interviews');

// Debug middleware
router.use((req, res, next) => {
    console.log('Interviews Route Hit:', req.method, req.url);
    next();
});

// Protect all routes
router.use(protect);

// Get all interviews for user (changing from /user-interviews to /)
router.get('/', interviewController.getUserInterviews);

// Get upcoming interviews
router.get('/upcoming', interviewController.getUpcomingInterviews);

// Get interviews by status
router.get('/by-status', protect, interviewController.getInterviewsByStatus);

// Create interview
router.post('/', interviewController.createInterview);

// Update interview
router.put('/:id', interviewController.updateInterview);

// Delete interview
router.delete('/:id', interviewController.deleteInterview);

// Get interview details
router.get('/:id', interviewController.getInterviewDetails);

module.exports = router;