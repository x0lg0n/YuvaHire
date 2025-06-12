const app = require('./app')

// Try alternate ports if the default port is in use
// Default port from environment variable or fallback to 5000
const defaultPort = process.env.PORT || 5000;
const tryPorts = [defaultPort, 5001, 5002, 5003, 5004, 5005];

async function startServer() {
  for (const port of tryPorts) {
    try {
      const server = await new Promise((resolve, reject) => {
        const instance = app.listen(port, '0.0.0.0', () => {
          console.log(`Server is running on port ${port}`);
          resolve(instance);
        }).on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying next port...`);
            reject(err);
          } else {
            console.error('Server error:', err);
            reject(err);
          }
        });
      });
      
      // Store the active port for other parts of the application
      app.set('port', port);
      
      // Add graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM signal received. Closing HTTP server...');
        server.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });
      });

      return server;
    } catch (err) {
      // If this was the last port, throw the error
      if (port === tryPorts[tryPorts.length - 1]) {
        throw new Error(`Could not start server. All ports (${tryPorts.join(', ')}) are in use.`);
      }
      // Otherwise continue to next port
      continue;
    }
  }
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

