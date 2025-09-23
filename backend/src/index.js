const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studiesRoutes = require('./routes/studies');
const aiWorkflowRoutes = require('./routes/aiWorkflow');

// Import database connection
const { pool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware for validation errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body'
    });
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Illumina Backend API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      studies: '/api/studies',
      health: '/api/health'
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW()');

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbResult.rows[0].now
    });
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/studies', studiesRoutes);
app.use('/api/ai', aiWorkflowRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');

  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');

  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }

  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Illumina Backend API is running on port ${PORT}`);
  console.log(`📚 Study content path: ${process.env.STUDIES_PATH || './studies'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'not configured'}`);

  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  Warning: DATABASE_URL not configured. Some features may not work.');
  }

  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  Warning: JWT_SECRET not configured. Authentication will not work.');
  }
});