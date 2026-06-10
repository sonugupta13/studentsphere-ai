import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import passport from 'passport';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import examRoutes from './routes/examRoutes.js';
import cgpaRoutes from './routes/cgpaRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import codingRoutes from './routes/codingRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import http from 'http';
import { initSocket } from './utils/socket.js';

import { errorHandler } from './middleware/errorMiddleware.js';
import { authenticateUser, authorizeRoles } from './middleware/authMiddleware.js';
import './config/passport.js'; // load passport configurations


// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration (Essential for cookie auth)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body and Cookie Parser
app.use(express.json({ limit: '10kb' })); // Limit body sizes to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

// Initialize Passport (Google Strategy loaded above)
app.use(passport.initialize());

// Root test route
app.get('/', (req, res) => {
  res.json({ message: 'StudentSphere AI Authentication API is running...' });
});

// Auth endpoints
app.use('/api/auth', authRoutes);

// Dashboard endpoints
app.use('/api/dashboard', dashboardRoutes);

// Attendance endpoints
app.use('/api/attendance', attendanceRoutes);

// Assignment endpoints
app.use('/api/assignments', assignmentRoutes);

// Notes endpoints
app.use('/api/notes', notesRoutes);

// Exam planner endpoints
app.use('/api/exams', examRoutes);

// CGPA Calculator endpoints
app.use('/api/cgpa', cgpaRoutes);

// Resume Builder endpoints
app.use('/api/resumes', resumeRoutes);

// Coding Progress Tracker endpoints
app.use('/api/coding', codingRoutes);

// Expense Tracker endpoints
app.use('/api/expenses', expenseRoutes);

// Community Forum endpoints
app.use('/api/community', communityRoutes);

// Admin endpoints
app.use('/api/admin', adminRoutes);


// Static uploads serving
app.use('/uploads', express.static('uploads'));

// Global Error Handler Middleware
app.use(errorHandler);

// create http server
const server = http.createServer(app);

// initialize socket
initSocket(server, allowedOrigins);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
