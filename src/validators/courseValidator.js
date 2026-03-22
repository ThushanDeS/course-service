const Joi = require('joi');

const createCourseSchema = Joi.object({
    courseCode: Joi.string().trim().uppercase().required().messages({
        'string.empty': 'Course code is required',
    }),
    courseName: Joi.string().trim().max(200).required().messages({
        'string.empty': 'Course name is required',
        'string.max': 'Course name cannot exceed 200 characters',
    }),
    description: Joi.string().trim().max(1000).allow('').messages({
        'string.max': 'Description cannot exceed 1000 characters',
    }),
    credits: Joi.number().integer().min(1).max(6).required().messages({
        'number.base': 'Credits must be a number',
        'number.min': 'Credits must be at least 1',
        'number.max': 'Credits cannot exceed 6',
    }),
    department: Joi.string().trim().required().messages({
        'string.empty': 'Department is required',
    }),
    semester: Joi.number().integer().min(1).max(8).required().messages({
        'number.min': 'Semester must be between 1 and 8',
        'number.max': 'Semester must be between 1 and 8',
    }),
    maxEnrollment: Joi.number().integer().min(1).default(100),
    instructor: Joi.string().trim().allow(''),
    schedule: Joi.object({
        day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
        startTime: Joi.string(),
        endTime: Joi.string(),
        room: Joi.string(),
    }),
});

const updateCourseSchema = Joi.object({
    courseName: Joi.string().trim().max(200),
    description: Joi.string().trim().max(1000).allow(''),
    credits: Joi.number().integer().min(1).max(6),
    department: Joi.string().trim(),
    semester: Joi.number().integer().min(1).max(8),
    maxEnrollment: Joi.number().integer().min(1),
    instructor: Joi.string().trim().allow(''),
    schedule: Joi.object({
        day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
        startTime: Joi.string(),
        endTime: Joi.string(),
        room: Joi.string(),
    }),
    isActive: Joi.boolean(),
}).min(1).messages({
    'object.min': 'At least one field must be provided for update',
});

const enrollSchema = Joi.object({
    courseId: Joi.string().required().messages({
        'string.empty': 'Course ID is required',
    }),
});

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages,
            });
        }

        req.body = value;
        next();
    };
};

module.exports = {
    createCourseSchema,
    updateCourseSchema,
    enrollSchema,
    validate,
};
