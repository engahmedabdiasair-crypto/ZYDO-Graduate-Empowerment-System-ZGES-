const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());







mongoose.connect(
  process.env.MONGODB_URI || 'mongodb+srv://ali:1234@cluster0.yyp279x.mongodb.net/Zydo?retryWrites=true&w=majority'
)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


// Graduate Schema
const graduateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  faculty: { type: String, required: true },
  graduationYear: { type: Number, required: true },
  telephone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Graduate = mongoose.model('Graduate', graduateSchema);

// API Routes
// Get all graduates
app.get('/api/graduates', async (req, res) => {
  try {
    const graduates = await Graduate.find().sort({ createdAt: -1 });
    res.json(graduates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new graduate
app.post('/api/graduates', async (req, res) => {
  try {
    const { name, faculty, graduationYear, telephone } = req.body;
    
    // Validate input
    if (!name || !faculty || !graduationYear || !telephone) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const newGraduate = new Graduate({
      name,
      faculty,
      graduationYear,
      telephone
    });
    
    const savedGraduate = await newGraduate.save();
    res.status(201).json(savedGraduate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a graduate
app.delete('/api/graduates/:id', async (req, res) => {
  try {
    const graduate = await Graduate.findById(req.params.id);
    if (!graduate) {
      return res.status(404).json({ message: 'Graduate not found' });
    }
    
    await Graduate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Graduate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve static files from the public directory
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});