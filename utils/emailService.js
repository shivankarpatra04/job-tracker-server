const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendResetPasswordEmail = async (email, resetUrl) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password Reset Request',
            html: `
            <h1>Password Reset Request</h1>
            <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
            <p>Please click on the following link to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            `
        };

        console.log('Sending password reset email to:', email);
        console.log('Reset URL in email:', resetUrl);

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Email service error:', error);
        throw new Error('Error sending email');
    }
};

module.exports = { sendResetPasswordEmail };