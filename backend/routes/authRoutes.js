import express from 'express';
import passport from 'passport';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  googleCallback,
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Registration and Login routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Logout and current profile details
router.post('/logout', authenticateUser, logoutUser);
router.get('/me', authenticateUser, getCurrentUser);

// Password recovery routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // stateless JWT, no session
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:5173/login?error=GoogleAuthFailed',
  }),
  googleCallback
);

export default router;
