import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentsphere');
    console.log('Connected to MongoDB.');

    const email = 'skg9199725658@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      process.exit(1);
    }

    // Set new password (the pre-save hook in User.js will automatically hash it with bcrypt)
    user.password = '123456';
    await user.save();
    
    console.log(`Successfully reset password for ${email} to "123456"!`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error.message);
    process.exit(1);
  }
};

resetPassword();
