require('dotenv').config({ path: '.env.development' }); // Adjust path based on your folder structure
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

// Import JSON data
const users = require('./users.json');
const applications = require('./applications.json');
const interviews = require('./interviews.json');

// MongoDB Atlas Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

const seedDatabase = async () => {
    try {
        // Connect to MongoDB Atlas
        await connectDB();

        // Clear existing data
        await User.deleteMany({});
        await Application.deleteMany({});
        await Interview.deleteMany({});

        console.log('Existing data cleared');

        // Create users with hashed passwords
        const createdUsers = await Promise.all(
            users.map(async user => {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                return User.create({
                    ...user,
                    password: hashedPassword
                });
            })
        );
        console.log('Users created');

        // Create users with hashed passwords
        // const createdUsers = await Promise.all(
        //     users.map(async user => {
        //         return User.create({
        //             email: user.email,
        //             firstName: user.firstName,
        //             lastName: user.lastName,
        //             password: user.password  // Plain password, will be hashed by model
        //         });
        //     })
        // );
        // console.log('Users created successfully');

        // Create applications with user references
        const createdApplications = await Promise.all(
            applications.map((app, index) => {
                return Application.create({
                    company: app.company,
                    position: app.position,
                    location: app.location,
                    status: app.status,
                    jobType: app.jobType,
                    salary: {
                        min: app.salary.min,
                        max: app.salary.max,
                        currency: app.salary.currency
                    },
                    applicationDate: new Date(app.applicationDate),
                    source: app.source,
                    remote: app.remote,
                    notes: app.notes,
                    nextStep: app.nextStep,
                    priority: app.priority,
                    user: createdUsers[index % createdUsers.length]._id
                });
            })
        );
        console.log('Applications created');

        // Create interviews
        await Promise.all(
            interviews.map((interview, index) => {
                return Interview.create({
                    ...interview,
                    date: new Date(interview.date),
                    user: createdUsers[index % createdUsers.length]._id,
                    application: createdApplications[index % createdApplications.length]._id
                });
            })
        );
        console.log('Interviews created');

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // Close server & exit process
    process.exit(1);
});

seedDatabase();