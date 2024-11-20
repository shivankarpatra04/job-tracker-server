const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    location: String,
    status: {
        type: String,
        enum: ['Applied', 'Interview', 'Offer', 'Accepted', 'Rejected'],
        default: 'Applied'
    },
    applicationDate: {
        type: Date,
        default: Date.now
    },
    nextStep: {
        type: String,
        trim: true,
        default: 'Await response'  // Add a default value
    },
    interviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interview'
    }]
}, {
    timestamps: true
});

// Add index for faster queries
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);