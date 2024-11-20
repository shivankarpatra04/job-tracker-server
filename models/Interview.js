const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: String,
    location: String,
    platform: String,
    interviewer: String,
    notes: String,
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    }
}, {
    timestamps: true
});

// Update application's interviews array when creating interview
interviewSchema.post('save', async function () {
    await this.model('Application').findByIdAndUpdate(
        this.application,
        { $addToSet: { interviews: this._id } }
    );
});

// Add index for faster queries
interviewSchema.index({ user: 1, date: 1 });
interviewSchema.index({ application: 1 });

module.exports = mongoose.model('Interview', interviewSchema);