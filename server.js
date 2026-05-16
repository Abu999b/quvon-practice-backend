// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
// app.use(express.json());

// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/admin', require('./routes/admin'));
// app.use('/api/student', require('./routes/student'));
// app.use('/api/courses', require('./routes/courses'));

// app.get('/', (req, res) => res.json({ message: 'EdTech API running' }));

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('MongoDB connected');
//     app.listen(process.env.PORT || 5000, () => {
//       console.log('Server running on port', process.env.PORT || 5000);
//     });
//   })
//   .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS — allow your Vercel frontend
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Health check — shows server + DB status
app.get('/', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    server: 'EdTech API running',
    database: states[dbState] || 'unknown',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      MONGO_URI_SET: !!process.env.MONGO_URI,
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      CLIENT_URL: process.env.CLIENT_URL || 'not set'
    }
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/student'));
app.use('/api/courses', require('./routes/courses'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Connect MongoDB then start server
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in environment variables!');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
