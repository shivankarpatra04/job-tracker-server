const Interview = require('../models/Interview');
const Application = require('../models/Application');

const interviewController = {
    // Get all interviews for a user
    getUserInterviews: async (req, res) => {
        try {
            console.log('Getting interviews for user:', req.user.id); // Debug log
            const userId = req.user.id;

            const interviews = await Interview.find({ user: userId })
                .populate({
                    path: 'application',
                    select: 'company position'
                })
                .select('-__v')
                .sort({ date: 1 });

            const stats = {
                total: interviews.length,
                upcoming: interviews.filter(int => new Date(int.date) > new Date()).length,
                completed: interviews.filter(int => int.status === 'Completed').length,
                cancelled: interviews.filter(int => int.status === 'Cancelled').length
            };

            res.status(200).json({
                success: true,
                stats,
                data: interviews
            });
        } catch (error) {
            console.error('Error fetching user interviews:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching interviews'
            });
        }
    },

    // Create new interview
    createInterview: async (req, res) => {
        try {
            // Verify the application exists and belongs to user
            const application = await Application.findOne({
                _id: req.body.application,
                user: req.user.id
            });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
            }

            const interviewData = {
                ...req.body,
                user: req.user.id
            };

            const interview = await Interview.create(interviewData);

            // Update application status to Interview
            await Application.findByIdAndUpdate(application._id, {
                status: 'Interview'
            });

            res.status(201).json({
                success: true,
                data: interview
            });
        } catch (error) {
            console.error('Error creating interview:', error);
            res.status(500).json({
                success: false,
                error: 'Error creating interview'
            });
        }
    },

    // Update interview
    updateInterview: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            let interview = await Interview.findOne({ _id: id, user: userId });

            if (!interview) {
                return res.status(404).json({
                    success: false,
                    error: 'Interview not found'
                });
            }

            interview = await Interview.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            ).populate('application', 'company position');

            res.status(200).json({
                success: true,
                data: interview
            });
        } catch (error) {
            console.error('Error updating interview:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating interview'
            });
        }
    },

    // Update interview status
    updateInterviewStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validate status
            if (!['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status'
                });
            }

            // Find and update the interview
            const interview = await Interview.findOneAndUpdate(
                { _id: id, user: req.user.id },
                {
                    status,
                    completedAt: status === 'Completed' ? new Date() : undefined
                },
                { new: true }
            ).populate('application', 'company position');

            if (!interview) {
                return res.status(404).json({
                    success: false,
                    error: 'Interview not found'
                });
            }

            // If interview is completed, update application status to reflect this
            if (status === 'Completed' && interview.application) {
                await Application.findByIdAndUpdate(
                    interview.application._id,
                    { $set: { status: 'Interview' } }
                );
            }

            res.status(200).json({
                success: true,
                data: interview
            });
        } catch (error) {
            console.error('Error updating interview status:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating interview status'
            });
        }
    },

    // Delete interview
    deleteInterview: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Use findOneAndDelete instead of remove()
            const deletedInterview = await Interview.findOneAndDelete({
                _id: id,
                user: userId
            });

            if (!deletedInterview) {
                return res.status(404).json({
                    success: false,
                    error: 'Interview not found'
                });
            }

            res.status(200).json({
                success: true,
                data: {}
            });
        } catch (error) {
            console.error('Error deleting interview:', error);
            res.status(500).json({
                success: false,
                error: 'Error deleting interview'
            });
        }
    },

    // Get upcoming interviews
    getUpcomingInterviews: async (req, res) => {
        try {
            const userId = req.user.id;

            const upcomingInterviews = await Interview.find({
                user: userId,
                date: { $gte: new Date() },
                status: 'Scheduled'
            })
                .populate({
                    path: 'application',
                    select: 'company position'
                })
                .select('date type location platform meetingLink')
                .sort({ date: 1 })
                .limit(5);

            res.status(200).json({
                success: true,
                data: upcomingInterviews
            });
        } catch (error) {
            console.error('Error fetching upcoming interviews:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching upcoming interviews'
            });
        }
    },

    // Get interview details
    getInterviewDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const interview = await Interview.findOne({
                _id: id,
                user: userId
            }).populate({
                path: 'application',
                select: 'company position status'
            });

            if (!interview) {
                return res.status(404).json({
                    success: false,
                    error: 'Interview not found'
                });
            }

            res.status(200).json({
                success: true,
                data: interview
            });
        } catch (error) {
            console.error('Error fetching interview details:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching interview details'
            });
        }
    },

    // Get interviews by status
    getInterviewsByStatus: async (req, res) => {
        try {
            const { status = 'Upcoming' } = req.query;
            const dateFilter = status === 'Upcoming' ?
                { date: { $gte: new Date() } } :
                { date: { $lt: new Date() } };

            const interviews = await Interview.find({
                user: req.user.id,
                ...dateFilter
            })
                .populate('application', 'company position')
                .sort({ date: status === 'Upcoming' ? 1 : -1 });

            const formattedInterviews = interviews.map(interview => ({
                id: interview._id,
                type: interview.type,
                company: interview.application.company,
                position: interview.application.position,
                date: interview.date,
                time: interview.time,
                location: interview.location,
                platform: interview.platform,
                interviewer: interview.interviewer,
                notes: interview.notes,
                status: interview.status
            }));

            res.status(200).json({
                success: true,
                data: formattedInterviews
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = interviewController;