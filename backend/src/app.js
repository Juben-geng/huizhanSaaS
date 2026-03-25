const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 429, msg: '请求过于频繁，请稍后再试' }
});

app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const db = require('./config/database');
const logger = require('./utils/logger');
const quotaManager = require('./services/quotaManager');

app.use((req, res, next) => {
  req.io = io;
  req.db = db;
  req.logger = logger;
  req.quotaManager = quotaManager;
  next();
});

const routes = [
  { path: '/api/user', file: './routes/userRoutes' },
  { path: '/api/merchant', file: './routes/merchantRoutes' },
  { path: '/api/admin', file: './routes/adminRoutes' },
  { path: '/api/platform', file: './routes/platformRoutes' },
  { path: '/api/ai', file: './routes/aiRoutes' },
  { path: '/api/virtual-room', file: './routes/virtualRoomRoutes' },
  { path: '/api/data-screen', file: './routes/dataScreenRoutes' }
];

routes.forEach(route => {
  try {
    app.use(route.path, require(route.file));
    logger.info(`Route loaded: ${route.path}`);
  } catch (error) {
    logger.error(`Failed to load route ${route.path}:`, error);
  }
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-exhibition', (exhibitionId) => {
    socket.join(`exhibition-${exhibitionId}`);
    logger.info(`Client ${socket.id} joined exhibition ${exhibitionId}`);
  });

  socket.on('join-room', (roomId) => {
    socket.join(`room-${roomId}`);
    logger.info(`Client ${socket.id} joined virtual room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(`room-${roomId}`);
    logger.info(`Client ${socket.id} left virtual room ${roomId}`);
  });

  socket.on('send-message', async (data) => {
    const { roomId, userId, merchantId, messageType, content, fileUrl } = data;
    const chatRecordId = require('uuid').v4();
    const ChatRecord = require('./models').ChatRecord;
    
    try {
      await ChatRecord.create({
        chatRecordId,
        roomId,
        userId,
        merchantId,
        messageType,
        content,
        fileUrl,
        senderType: data.senderType || 'user',
        status: 'sent'
      });

      io.to(`room-${roomId}`).emit('new-message', {
        chatRecordId,
        roomId,
        userId,
        merchantId,
        messageType,
        content,
        fileUrl,
        senderType: data.senderType || 'user',
        createdAt: new Date()
      });
    } catch (error) {
      logger.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    code: err.status || 500,
    msg: err.message || '服务器内部错误',
    data: null
  });
});

const PORT = process.env.PORT || 3000;

db.sequelize.sync().then(async () => {
  try {
    const initTeacherAccount = require('./scripts/initTeacher');
    await initTeacherAccount(db);
  } catch (error) {
    logger.warn('Failed to initialize teacher account:', error.message);
  }

  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  logger.warn('Database connection failed, starting server without database:', err.message);
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} (database unavailable)`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = { app, io };
