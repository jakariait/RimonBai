require('express-async-errors');
require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const connectDB = require('./database/connection');
const errorHandler = require('./middleware/errorHandler');
const mongoSanitize = require('./middleware/mongoSanitize');
const xssProtection = require('./middleware/xssProtection');

const app = express();

// Database connection
connectDB();

// Security Middlewares
app.set('trust proxy', 1);
app.use(compression());
app.use(cookieParser());

const corsOptions = {
  origin: config.clientUrl.length > 0 ? config.clientUrl : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(hpp());
app.use(mongoSanitize);
app.use(xssProtection);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many requests' },
});
app.use(limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// Routes
app.use('/api', require('./routes'));

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
