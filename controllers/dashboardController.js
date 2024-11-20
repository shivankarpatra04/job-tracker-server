const Application = require('../models/Application');
const Interview = require('../models/Interview');
const { startOfWeek, endOfWeek } = require('date-fns');

const dashboardController = {
    // Get dashboard statistics
    getDashboardStats: async (req, res) => {
        try {
            const userId = req.user.id;
            const now = new Date();
            const weekStart = startOfWeek(now);
            const weekEnd = endOfWeek(now);

            // Get scheduled interviews count
            const upcomingInterviews = await Interview.countDocuments({
                user: userId,
                status: 'Scheduled',
                date: { $gte: now }
            });

            // Get weekly scheduled interviews
            const weeklyInterviews = await Interview.countDocuments({
                user: userId,
                status: 'Scheduled',
                date: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            });

            // Get all applications counts by status
            const applications = await Application.find({ user: userId });

            const statusCounts = {
                total: applications.length,
                applied: applications.filter(app => app.status === 'Applied').length,
                interview: applications.filter(app => app.status === 'Interview').length,
                offer: applications.filter(app => app.status === 'Offer').length,
                accepted: applications.filter(app => app.status === 'Accepted').length,
                rejected: applications.filter(app => app.status === 'Rejected').length
            };

            // Get weekly applications
            const weeklyApplications = applications.filter(app =>
                new Date(app.applicationDate) >= weekStart &&
                new Date(app.applicationDate) <= weekEnd
            ).length;

            // Get weekly rejections
            const weeklyRejections = applications.filter(app =>
                app.status === 'Rejected' &&
                new Date(app.applicationDate) >= weekStart &&
                new Date(app.applicationDate) <= weekEnd
            ).length;

            res.status(200).json({
                success: true,
                data: {
                    applications: {
                        total: statusCounts.total,
                        weeklyChange: weeklyApplications,
                        weeklyChangeText: `+${weeklyApplications} this week`
                    },
                    interviews: {
                        total: upcomingInterviews,
                        upcoming: upcomingInterviews,
                        thisWeek: weeklyInterviews,
                        upcomingText: `${weeklyInterviews} this week`
                    },
                    offers: {
                        total: statusCounts.offer + statusCounts.accepted,
                        pending: statusCounts.offer,
                        pendingText: `${statusCounts.offer} pending response`
                    },
                    rejections: {
                        total: statusCounts.rejected,
                        weeklyChange: weeklyRejections,
                        weeklyChangeText: `${weeklyRejections} this week`
                    }
                }
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching dashboard statistics'
            });
        }
    },
    // Get recent activity
    getRecentActivity: async (req, res) => {
        try {
            const userId = req.user.id;

            // Get recent applications
            const recentApplications = await Application.find({ user: userId })
                .sort({ applicationDate: -1 })
                .limit(5)
                .select('company position status location applicationDate');

            // Get upcoming interviews
            const upcomingInterviews = await Interview.find({
                user: userId,
                date: { $gte: new Date() },
                status: "Scheduled"
            })
                .sort({ date: 1 })
                .limit(5)
                .populate('application', 'company position');

            res.status(200).json({
                success: true,
                data: {
                    recentApplications,
                    upcomingInterviews
                }
            });
        } catch (error) {
            console.error('Recent activity error:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching recent activity'
            });
        }
    },

    // Get activity timeline
    getActivityTimeline: async (req, res) => {
        try {
            const userId = req.user.id;
            const timelineLimit = 10;

            // Get applications with their status
            const applications = await Application.find({
                user: userId,
            })
                .sort({ applicationDate: -1 })
                .limit(timelineLimit)
                .select('company position status applicationDate location');

            // Get interviews with application details
            const interviews = await Interview.find({
                user: userId
            })
                .sort({ date: -1 })
                .limit(timelineLimit)
                .populate('application', 'company position')
                .select('type date status interviewer location platform application');

            // Combine and format activities
            const activities = [
                // Format applications
                ...applications.map(app => ({
                    type: 'application',
                    title: `Applied to ${app.company}`,
                    subtitle: app.position,
                    status: app.status,
                    date: app.applicationDate,
                    location: app.location
                })),

                // Format interviews
                ...interviews.map(interview => ({
                    type: 'interview',
                    title: `${interview.type} Interview`,
                    subtitle: interview.application
                        ? `${interview.application.company} - ${interview.application.position}`
                        : 'Interview Scheduled',
                    status: interview.status,
                    date: interview.date,
                    location: interview.location,
                    platform: interview.platform,
                    interviewer: interview.interviewer
                }))
            ]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, timelineLimit);

            res.status(200).json({
                success: true,
                data: activities
            });
        } catch (error) {
            console.error('Activity timeline error:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching activity timeline'
            });
        }
    }
};

module.exports = dashboardController;