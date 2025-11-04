require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');

// Import configurations and routes
const { connectBMSDB, connectSMSDB, closeConnections } = require('./src/config/database');
const routes = require('./src/routes');
const { initializeSchedulers, stopSchedulers } = require('./src/schedulers');
const { setupSocketHandlers } = require('./src/utils/socketHandlers');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SMS Gateway Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler (must be before error handler)
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO setup
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
  try {
    // Test database connections
    console.log('Testing database connections...');
    await connectBMSDB();
    await connectSMSDB();
    console.log('Database connections established successfully');

    // Initialize schedulers if enabled
    if (process.env.SCHEDULER_ENABLED === 'true') {
      console.log('Initializing schedulers...');
      await initializeSchedulers();
      console.log('Schedulers initialized successfully');
    }

    // Start the server
    server.listen(PORT, () => {
      console.log(`SMS Gateway Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown function
async function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);

  try {
    // Stop schedulers first
    console.log('Stopping schedulers...');
    await stopSchedulers();

    // Close Socket.IO connections
    console.log('Closing Socket.IO connections...');
    io.close();

    // Close HTTP server
    console.log('Closing HTTP server...');
    server.close(async () => {
      try {
        // Close database connections
        console.log('Closing database connections...');
        await closeConnections();
        console.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

startServer();
