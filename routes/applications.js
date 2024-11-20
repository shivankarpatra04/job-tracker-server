const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getUserApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    getRecentApplications,
    getApplicationDetails,
    getFormattedApplications,
    getApplicationWithInterview
} = require('../controllers/applications');

// Debug middleware
router.use((req, res, next) => {
    console.log('Applications Route Hit:', req.method, req.url);
    next();
});

// Protect all routes
router.use(protect);

// Application routes
router.route('/')
    .get(getUserApplications)
    .post(createApplication);

router.route('/recent')
    .get(getRecentApplications);

router.route('/formatted')
    .get(getFormattedApplications);

router.route('/:id')
    .put(updateApplication)
    .delete(deleteApplication);

router.route('/:id/details')
    .get(getApplicationDetails);

router.route('/:id/with-interview')
    .get(getApplicationWithInterview);

module.exports = router;