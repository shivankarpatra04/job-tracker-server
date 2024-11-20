const Application = require('../models/Application');

const applicationController = {
    // Get all applications for a specific user
    getUserApplications: async (req, res) => {
        try {
            console.log('Getting applications for user:', req.user.id); // Debug log
            const userId = req.user.id;

            const applications = await Application.find({ user: userId })
                .select('-__v')
                .sort({ applicationDate: -1 });

            const stats = {
                total: applications.length,
                status: {
                    applied: applications.filter(app => app.status === 'Applied').length,
                    interviewing: applications.filter(app => app.status === 'Interview').length,
                    offered: applications.filter(app => app.status === 'Offer').length,
                    rejected: applications.filter(app => app.status === 'Rejected').length
                }
            };

            res.status(200).json({
                success: true,
                count: applications.length,
                stats,
                data: applications
            });
        } catch (error) {
            console.error('Error fetching user applications:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching applications'
            });
        }
    },

    // Create new application
    createApplication: async (req, res) => {
        try {
            const applicationData = {
                ...req.body,
                user: req.user.id
            };

            const application = await Application.create(applicationData);

            res.status(201).json({
                success: true,
                data: application
            });
        } catch (error) {
            console.error('Error creating application:', error);
            res.status(500).json({
                success: false,
                error: 'Error creating application'
            });
        }
    },

    // Update application
    updateApplication: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            let application = await Application.findOne({ _id: id, user: userId });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }

            application = await Application.findByIdAndUpdate(
                id,
                { ...req.body },
                { new: true, runValidators: true }
            );

            res.status(200).json({
                success: true,
                data: application
            });
        } catch (error) {
            console.error('Error updating application:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating application'
            });
        }
    },

    // Delete application
    deleteApplication: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Use findOneAndDelete instead of remove()
            const deletedApplication = await Application.findOneAndDelete({
                _id: id,
                user: userId
            });

            if (!deletedApplication) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }

            res.status(200).json({
                success: true,
                data: {}
            });
        } catch (error) {
            console.error('Error deleting application:', error);
            res.status(500).json({
                success: false,
                error: 'Error deleting application'
            });
        }
    },

    // Get recent applications
    getRecentApplications: async (req, res) => {
        try {
            const userId = req.user.id;

            const recentApplications = await Application.find({ user: userId })
                .select('company position location status applicationDate')
                .sort({ applicationDate: -1 })
                .limit(5);

            res.status(200).json({
                success: true,
                data: recentApplications
            });
        } catch (error) {
            console.error('Error fetching recent applications:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching recent applications'
            });
        }
    },

    // Get application details
    getApplicationDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const application = await Application.findOne({
                _id: id,
                user: userId
            }).populate({
                path: 'interviews',
                select: 'date type status notes interviewer location'
            });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }

            res.status(200).json({
                success: true,
                data: application
            });
        } catch (error) {
            console.error('Error fetching application details:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching application details'
            });
        }
    },

    // Get formatted applications for UI
    getFormattedApplications: async (req, res) => {
        try {
            const applications = await Application.find({ user: req.user.id })
                .select('company position status applicationDate nextStep location')
                .sort({ applicationDate: -1 });

            const formattedApplications = applications.map(app => ({
                company: app.company,
                location: app.location,
                position: app.position,
                status: app.status,
                appliedDate: app.applicationDate,
                nextStep: app.nextStep,
                id: app._id
            }));

            res.status(200).json({
                success: true,
                data: formattedApplications
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get detailed application with related interview
    getApplicationWithInterview: async (req, res) => {
        try {
            const application = await Application.findOne({
                _id: req.params.id,
                user: req.user.id
            }).populate({
                path: 'interviews',
                select: 'type date time location platform interviewer notes status'
            });

            res.status(200).json({
                success: true,
                data: application
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
};

module.exports = applicationController;