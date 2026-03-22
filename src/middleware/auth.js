const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');

/**
 * Middleware to authenticate JWT tokens by:
 * 1. Verifying the token locally using the shared JWT secret
 * 2. Optionally validating against the Auth Service (inter-service communication)
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];

        // Option 1: Local JWT verification (faster, uses shared secret)
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = {
                userId: decoded.userId,
            };

            // Option 2: Validate against Auth Service for full user data (inter-service communication)
            try {
                const authResponse = await axios.get(
                    `${config.authService.url}/auth/validate`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 5000,
                    }
                );

                if (authResponse.data.valid) {
                    req.user = {
                        userId: authResponse.data.data.userId,
                        email: authResponse.data.data.email,
                        studentId: authResponse.data.data.studentId,
                        role: authResponse.data.data.role,
                        firstName: authResponse.data.data.firstName,
                        lastName: authResponse.data.data.lastName,
                    };
                }
            } catch (authServiceError) {
                // Auth service unavailable — fall back to local token data
                console.warn('Auth service unavailable, using local token data'); // eslint-disable-line no-console
            }

            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired.',
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { authenticate };
