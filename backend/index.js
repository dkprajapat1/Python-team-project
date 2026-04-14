require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Mood = require('./models/Mood');

const app = express();
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/detect';

// Middleware
app.use(cors());
app.use(express.json());

// Set up Multer for handling file uploads (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/moodtracker')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/detect-mood', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Forward image to AI service via raw binary
    const aiResponse = await axios.post(AI_SERVICE_URL, req.file.buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    const { emotion, confidence } = aiResponse.data;

    // Save result to DB
    const newMood = new Mood({
      emotion,
      confidence,
    });
    await newMood.save();

    res.json({ emotion, confidence, savedId: newMood._id });
  } catch (error) {
    console.error('Error in /detect-mood:', error.message);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

app.get('/mood-history', async (req, res) => {
  try {
    // Return latest 20 moods
    const history = await Mood.find().sort({ timestamp: -1 }).limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

