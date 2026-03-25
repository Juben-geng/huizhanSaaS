const express = require('express');
const app = express();
const platformRoutes = require('./src/routes/platformRoutes');

app.use('/api/platform', platformRoutes);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log(`Testing: POST http://localhost:${PORT}/api/platform/auth/login`);
});

process.on('SIGINT', () => {
  console.log('\nDebug server stopped');
  process.exit(0);
});
