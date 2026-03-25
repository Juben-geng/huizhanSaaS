try {
  const platformRoutes = require('./src/routes/platformRoutes');
  console.log('✅ platformRoutes loaded successfully');
  console.log('Type:', typeof platformRoutes);
  console.log('Has router methods:', typeof platformRoutes.post === 'function');
  
  const express = require('express');
  const app = express();
  app.use('/api/platform', platformRoutes);
  console.log('✅ Route mounted successfully');
  
  const routes = app._router.stack;
  console.log('\nAvailable routes:');
  routes.forEach((middleware, i) => {
    if (middleware.route) {
      console.log(`  ${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          console.log(`  ${handler.route.stack[0].method.toUpperCase()} /api/platform${handler.route.path}`);
        }
      });
    }
  });
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
