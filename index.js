const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env' });

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Enhanced Debug middleware
app.use((req, res, next) => {
    console.log('--------------------');
    console.log('Request Details:');
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('--------------------');
    next();
});

// Middleware
app.use(cors({
    origin: ['https://job-tracker-plum.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route for API health check
app.get('/', (req, res) => {
    res.json({
        message: 'API is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Mount routes
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const interviewRoutes = require('./routes/interviews');
const dashboardRoutes = require('./routes/dashboard');
const profileRoutes = require('./routes/profile');

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);

// Error handling middleware
app.use(errorHandler);

// Handle undefined routes - more detailed error response
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Resource not found',
        requestedUrl: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Start server with error handling
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
    console.log('Frontend URL:', process.env.FRONTEND_URL || 'Using default CORS settings');
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server Error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

module.exports = app;