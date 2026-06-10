import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_google_client_id_placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_client_secret_placeholder',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!email) {
          return done(new Error('No email returned from Google OAuth'), null);
        }

        let user = await User.findOne({ email });

        if (user) {
          // Update avatar if we don't have one and Google provides it
          if (!user.avatar && profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
            await user.save();
          }
          return done(null, user);
        }

        // Generate avatar from photo or initials
        const avatarUrl = profile.photos && profile.photos[0] 
          ? profile.photos[0].value 
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=random&color=fff`;

        // Register new user
        user = await User.create({
          fullName: profile.displayName,
          email,
          avatar: avatarUrl,
          provider: 'google',
          isVerified: true, // Google emails are pre-verified
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
