const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../config/emailConfig');
const nodemailer = require('nodemailer');

// Register User
// Register User
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword });
  
      // Save the user to the database
      await newUser.save();
  
      console.log('User registered successfully:', newUser); // Debug log
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error('Error registering user:', err.message); // Debug log
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  

// Login User
// Login User
// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Step 1: Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        console.log('Login failed: Email not found'); // Debug log
        return res.status(400).json({ message: 'Invalid credentials: Email not found' });
      }
  
      // Step 2: Compare the provided password with the hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isPasswordValid); // Debug log
  
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials: Password mismatch' });
      }
  
      // Step 3: Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      console.log('Login successful for user:', user.email); // Debug log
      res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
      console.error('Error during login:', err.message); // Debug log
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is ${otp}. It expires in 15 minutes.`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.resetOTP !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.resetOTP !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
