import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// Setup mail transporter helper
const createTransporter = () => {
  // Check if we have standard SMTP settings
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Default to a test account or mock logger
  return null;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Create the user (provider will defaults to 'local')
    const user = await User.create({
      fullName,
      email,
      password,
      provider: 'local',
      isVerified: false,
    });

    if (user) {
      // Set JWT http-only cookie
      generateToken(res, user._id, user.role);

      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          provider: user.provider,
          isVerified: user.isVerified,
        },
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    // Find user by email and select password (as it is unselected by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.status === 'Blocked') {
      res.status(403);
      throw new Error('Your account has been blocked by an administrator.');
    }

    // Check if user is registered via Google
    if (user.provider === 'google' && !user.password) {
      res.status(400);
      throw new Error('This account was created via Google Login. Please sign in with Google.');
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Set JWT http-only cookie
    generateToken(res, user._id, user.role);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0), // Set expiry in past to clear cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is already populated by authenticateUser middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400);
      throw new Error('Please provide an email address');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('User not found with that email');
    }

    if (user.provider === 'google') {
      res.status(400);
      throw new Error('This account was created via Google. Please log in with Google.');
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set resetPasswordToken field in User schema
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    // Expire token in 30 minutes
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    await user.save();

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested a password reset for your account on StudentSphere AI.\n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

    const transporter = createTransporter();

    if (transporter) {
      // Send real email if SMTP is configured
      await transporter.sendMail({
        to: user.email,
        from: `"StudentSphere AI Support" <${process.env.SMTP_FROM_EMAIL || 'noreply@studentsphere.ai'}>`,
        subject: 'StudentSphere AI - Password Reset Link',
        text: message,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email',
      });
    } else {
      // Fallback: log link in console for local developers, return link in json for convenience in dev
      console.log('============= RESET PASSWORD LINK =============');
      console.log(resetUrl);
      console.log('================================================');

      res.status(200).json({
        success: true,
        message: 'Password reset link generated (logged to server console)',
        // Return token directly in response for easier local testing/validation
        devResetUrl: resetUrl, 
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      res.status(400);
      throw new Error('Please provide a new password');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    // Get hashed version of token from URL param
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and verify token has not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired password reset token');
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.isVerified = true; // Mark as verified since they clicked reset link from email

    await user.save();

    // Authenticate user directly by setting cookie
    generateToken(res, user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth Callback handler
// @route   GET /api/auth/google/callback
// @access  Private (redirects client)
export const googleCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Authentication failed via Google');
    }

    // Generate JWT cookie
    generateToken(res, req.user._id, req.user.role);

    // Redirect user back to frontend dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    next(error);
  }
};
