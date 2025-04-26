const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- ENV VARIABLES ----------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager';
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

// ---------- MONGOOSE MODELS ----------
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

// ---------- AUTH MIDDLEWARE ----------
function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch {
    res.status(400).json({ message: 'Invalid token' });
  }
}

// ---------- AUTH ROUTES ----------
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    await User.create({ username, password: hashed });
    res.status(201).json({ message: 'User registered' });
  } catch {
    res.status(400).json({ message: 'User already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token });
});

// ---------- TASK ROUTES ----------
app.get('/api/tasks', authMiddleware, async (req, res) => {
  const tasks = await Task.find({ user: req.user });
  res.json(tasks);
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  const task = await Task.create({ ...req.body, user: req.user });
  res.status(201).json(task);
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user },
    req.body,
    { new: true }
  );
  res.json(task);
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, user: req.user });
  res.json({ message: 'Task deleted' });
});

// ---------- SERVER START ----------
mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err));
