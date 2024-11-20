const User = require('../models/User');
const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../utils/emailService');

// Register user
exports.register = async (req, res) => {
    try {
        console.log('Register endpoint hit:', req.body);

        const { email, password, firstName, lastName } = req.body;

        // Validate input
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                error: 'Please provide all required fields'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'Email is already registered'
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName
        });

        // Generate token
        const token = user.getSignedToken();

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password'
            });
        }

        // Check user exists and get password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if password matches
        try {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }
        } catch (error) {
            console.error('Password comparison error:', error);
            return res.status(500).json({
                success: false,
                error: 'Error verifying credentials'
            });
        }

        // Generate token
        const token = user.getSignedToken();

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Error logging in'
        });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No account found with that email'
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        try {
            await user.save({ validateBeforeSave: false });

            // Create reset URL with environment-aware base URL
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

            console.log('Generated reset URL:', resetUrl);

            await sendResetPasswordEmail(user.email, resetUrl);

            res.status(200).json({
                success: true,
                message: 'Password reset email sent'
            });
        } catch (error) {
            // Rollback token generation if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            console.error('Email send error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to send password reset email'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Server error processing password reset request'
        });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        console.log('Searching for token:', resetPasswordToken); // Debug log

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            console.log('No user found or token expired'); // Debug log
            return res.status(400).json({
                success: false,
                error: 'Invalid reset token'
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        // Log success
        console.log('Password reset successful for user:', user.email);

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
            token: user.getSignedToken()
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Could not reset password'
        });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Debug route - check reset token (remove in production)
exports.checkResetToken = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken
        });

        res.json({
            exists: !!user,
            tokenDetails: {
                provided: req.params.resetToken,
                hashed: hashedToken,
                stored: user ? user.resetPasswordToken : null,
                expired: user ? user.resetPasswordExpire < Date.now() : null,
                expire: user ? user.resetPasswordExpire : null
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};