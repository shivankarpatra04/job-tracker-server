const User = require('../models/User');
const JobApplication = require('../models/Application');  // Add this

const profileController = {
    // Get profile data
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            const profileData = {
                personal: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    location: user.location
                },
                professional: {
                    title: user.professional?.title,
                    bio: user.professional?.bio,
                    skills: user.professional?.skills || [],
                    portfolio: user.professional?.portfolio,
                    linkedin: user.professional?.linkedin,
                    github: user.professional?.github
                }
            };

            res.status(200).json({
                success: true,
                data: profileData
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching profile'
            });
        }
    },

    // Get job applications
    getJobApplications: async (req, res) => {
        try {
            const applications = await JobApplication.find({ user: req.user.id })
                .sort({ applicationDate: -1 });  // Sort by application date, newest first

            res.status(200).json({
                success: true,
                data: applications
            });
        } catch (error) {
            console.error('Error fetching job applications:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching job applications'
            });
        }
    }
};

module.exports = profileController;