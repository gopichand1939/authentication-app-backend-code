require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import CORS
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors()); // Use CORS middleware to enable cross-origin requests
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.use('/api/auth', authRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to the Authentication API');
});

// Connect to Database and Start Server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('Database connection failed:', err));
