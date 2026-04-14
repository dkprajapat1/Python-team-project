const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  emotion: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Mood', moodSchema);
