const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const connectDB = require('./config/database');
const swaggerSpec = require('./config/swagger');
const courseRoutes = require('./routes/courseRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --------------- Security Middleware ---------------
app.use(helmet());
app.use(
    cors({
        origin: config.cors.allowedOrigins,
        credentials: true,
    })
);

const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
});
app.use('/courses', limiter);

// --------------- General Middleware ---------------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

if (config.nodeEnv !== 'test') {
    app.use(morgan('combined'));
}

// --------------- API Documentation ---------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------- Routes ---------------
app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        service: 'course-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

app.use('/courses', courseRoutes);

// --------------- 404 Handler ---------------
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// --------------- Error Handler ---------------
app.use(errorHandler);

// --------------- Start Server ---------------
const startServer = async () => {
    await connectDB();

    const server = app.listen(config.port, () => {
        console.log(`Course Service running on port ${config.port}`); // eslint-disable-line no-console
        console.log(`API Docs: http://localhost:${config.port}/api-docs`); // eslint-disable-line no-console
    });

    return server;
};

if (config.nodeEnv !== 'test') {
    startServer();
}

module.exports = { app, startServer };
