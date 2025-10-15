const SmsService = require('../services/smsService');
const { getSchedulerStatus, getExecutionStatistics } = require('../schedulers');

// Store connected clients
const connectedClients = new Map();

// Setup Socket.IO event handlers
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Store client connection
    connectedClients.set(socket.id, {
      socket: socket,
      connectedAt: new Date(),
      subscriptions: new Set()
    });

    // Handle client authentication (optional)
    socket.on('authenticate', (data) => {
      try {
        // In a production environment, you might want to verify JWT token here
        const client = connectedClients.get(socket.id);
        if (client) {
          client.authenticated = true;
          client.userId = data.userId;
          client.username = data.username;
        }
        
        socket.emit('authenticated', { success: true });
        console.log(`Client ${socket.id} authenticated as ${data.username}`);
      } catch (error) {
        socket.emit('authentication_error', { error: error.message });
      }
    });

    // Handle subscription to SMS statistics
    socket.on('subscribe_sms_stats', () => {
      const client = connectedClients.get(socket.id);
      if (client) {
        client.subscriptions.add('sms_stats');
        console.log(`Client ${socket.id} subscribed to SMS statistics`);
        
        // Send initial statistics
        sendSmsStatistics(socket);
      }
    });

    // Handle subscription to scheduler status
    socket.on('subscribe_scheduler_status', () => {
      const client = connectedClients.get(socket.id);
      if (client) {
        client.subscriptions.add('scheduler_status');
        console.log(`Client ${socket.id} subscribed to scheduler status`);
        
        // Send initial scheduler status
        sendSchedulerStatus(socket);
      }
    });

    // Handle subscription to real-time SMS events
    socket.on('subscribe_sms_events', () => {
      const client = connectedClients.get(socket.id);
      if (client) {
        client.subscriptions.add('sms_events');
        console.log(`Client ${socket.id} subscribed to SMS events`);
      }
    });

    // Handle unsubscription
    socket.on('unsubscribe', (subscription) => {
      const client = connectedClients.get(socket.id);
      if (client && client.subscriptions.has(subscription)) {
        client.subscriptions.delete(subscription);
        console.log(`Client ${socket.id} unsubscribed from ${subscription}`);
      }
    });

    // Handle request for current statistics
    socket.on('get_current_stats', async () => {
      try {
        await sendSmsStatistics(socket);
        await sendSchedulerStatus(socket);
      } catch (error) {
        socket.emit('error', { message: 'Failed to get current statistics' });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });
  });

  // Set up periodic updates
  setupPeriodicUpdates(io);
  
  return io;
}

// Send SMS statistics to a specific socket
async function sendSmsStatistics(socket) {
  try {
    const [
      jobStats,
      historyStats,
      totalCount,
      dailyCount
    ] = await Promise.all([
      SmsService.getSmsJobStatistics(),
      SmsService.getSmsHistoryStatistics(),
      SmsService.getTotalSmsCount(),
      SmsService.getDailySmsCount(7) // Last 7 days
    ]);

    const statistics = {
      jobs: jobStats,
      history: historyStats,
      total: totalCount,
      daily: dailyCount,
      timestamp: new Date()
    };

    socket.emit('sms_statistics', statistics);
  } catch (error) {
    console.error('Error sending SMS statistics:', error);
    socket.emit('error', { message: 'Failed to get SMS statistics' });
  }
}

// Send scheduler status to a specific socket
async function sendSchedulerStatus(socket) {
  try {
    const [
      schedulerStatus,
      executionStats
    ] = await Promise.all([
      getSchedulerStatus(),
      getExecutionStatistics()
    ]);

    const status = {
      schedulers: schedulerStatus,
      execution: executionStats,
      timestamp: new Date()
    };

    socket.emit('scheduler_status', status);
  } catch (error) {
    console.error('Error sending scheduler status:', error);
    socket.emit('error', { message: 'Failed to get scheduler status' });
  }
}

// Broadcast SMS statistics to all subscribed clients
async function broadcastSmsStatistics(io) {
  try {
    const [
      jobStats,
      historyStats,
      totalCount,
      dailyCount
    ] = await Promise.all([
      SmsService.getSmsJobStatistics(),
      SmsService.getSmsHistoryStatistics(),
      SmsService.getTotalSmsCount(),
      SmsService.getDailySmsCount(7)
    ]);

    const statistics = {
      jobs: jobStats,
      history: historyStats,
      total: totalCount,
      daily: dailyCount,
      timestamp: new Date()
    };

    // Send to all clients subscribed to SMS stats
    connectedClients.forEach((client, socketId) => {
      if (client.subscriptions.has('sms_stats')) {
        client.socket.emit('sms_statistics', statistics);
      }
    });
  } catch (error) {
    console.error('Error broadcasting SMS statistics:', error);
  }
}

// Broadcast scheduler status to all subscribed clients
async function broadcastSchedulerStatus(io) {
  try {
    const [
      schedulerStatus,
      executionStats
    ] = await Promise.all([
      getSchedulerStatus(),
      getExecutionStatistics()
    ]);

    const status = {
      schedulers: schedulerStatus,
      execution: executionStats,
      timestamp: new Date()
    };

    // Send to all clients subscribed to scheduler status
    connectedClients.forEach((client, socketId) => {
      if (client.subscriptions.has('scheduler_status')) {
        client.socket.emit('scheduler_status', status);
      }
    });
  } catch (error) {
    console.error('Error broadcasting scheduler status:', error);
  }
}

// Broadcast SMS event to all subscribed clients
function broadcastSmsEvent(io, event) {
  connectedClients.forEach((client, socketId) => {
    if (client.subscriptions.has('sms_events')) {
      client.socket.emit('sms_event', {
        ...event,
        timestamp: new Date()
      });
    }
  });
}

// Setup periodic updates
function setupPeriodicUpdates(io) {
  // Update SMS statistics every 30 seconds
  setInterval(async () => {
    await broadcastSmsStatistics(io);
  }, 30000);

  // Update scheduler status every 60 seconds
  setInterval(async () => {
    await broadcastSchedulerStatus(io);
  }, 60000);
}

// Get connected clients info
function getConnectedClientsInfo() {
  const clients = [];
  connectedClients.forEach((client, socketId) => {
    clients.push({
      socketId,
      connectedAt: client.connectedAt,
      authenticated: client.authenticated || false,
      userId: client.userId,
      username: client.username,
      subscriptions: Array.from(client.subscriptions)
    });
  });
  return clients;
}

module.exports = {
  setupSocketHandlers,
  broadcastSmsStatistics,
  broadcastSchedulerStatus,
  broadcastSmsEvent,
  getConnectedClientsInfo
};
