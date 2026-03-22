const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 3002,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/course-service',
    },
    authService: {
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    },
    notificationService: {
        url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000'],
    },
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        snsEnrollmentTopicArn: process.env.SNS_ENROLLMENT_TOPIC_ARN || '',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    },
};
