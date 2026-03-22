const axios = require('axios');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const config = require('../config');

/**
 * GET /courses
 * List all available courses with optional filters.
 */
const getAllCourses = async (req, res, next) => {
    try {
        const { department, semester, search, page = 1, limit = 20 } = req.query;

        const filter = { isActive: true };

        if (department) {
            filter.department = department;
        }
        if (semester) {
            filter.semester = parseInt(semester, 10);
        }
        if (search) {
            filter.$or = [
                { courseName: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const courses = await Course.find(filter)
            .skip(skip)
            .limit(parseInt(limit, 10))
            .sort({ courseCode: 1 });

        const total = await Course.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                courses,
                pagination: {
                    total,
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                    pages: Math.ceil(total / parseInt(limit, 10)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /courses/:id
 * Get a single course by ID.
 */
const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        res.status(200).json({
            success: true,
            data: { course },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /courses
 * Create a new course (admin only).
 */
const createCourse = async (req, res, next) => {
    try {
        const course = await Course.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: { course },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /courses/:id
 * Update an existing course.
 */
const updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: { course },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /courses/:id
 * Soft-delete a course (set isActive to false).
 */
const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /courses/enroll
 * Enroll the authenticated student in a course.
 */
const enrollInCourse = async (req, res, next) => {
    try {
        const { courseId } = req.body;
        const { userId, studentId } = req.user;

        // Check if course exists and is active
        const course = await Course.findById(courseId);
        if (!course || !course.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Course not found or inactive',
            });
        }

        // Check enrollment capacity
        if (course.currentEnrollment >= course.maxEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'Course is full. Cannot enroll.',
            });
        }

        // Check for existing enrollment
        const existingEnrollment = await Enrollment.findOne({
            studentId,
            courseId,
            status: 'enrolled',
        });

        if (existingEnrollment) {
            return res.status(409).json({
                success: false,
                message: 'Already enrolled in this course',
            });
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            studentId,
            userId,
            courseId,
        });

        // Increment enrollment count
        await Course.findByIdAndUpdate(courseId, {
            $inc: { currentEnrollment: 1 },
        });

        // Populate course details in response
        await enrollment.populate('courseId');

        // Send Notification (Inter-Service Communication)
        try {
            const token = req.headers.authorization; // Pass the bearer token along
            await axios.post(
                `${config.notificationService.url}/notifications/send`,
                {
                    recipientId: studentId,
                    recipientEmail: req.user.email || 'student@example.com', // fallback if email isn't in token
                    type: 'enrollment',
                    title: 'Enrollment Confirmed',
                    message: `You have successfully enrolled in ${course.courseCode} - ${course.courseName}`,
                    source: {
                        service: 'course-service',
                        eventId: enrollment._id.toString()
                    },
                    metadata: {
                        courseId: course._id.toString(),
                        courseCode: course.courseCode,
                        courseName: course.courseName
                    },
                    priority: 'medium'
                },
                {
                    headers: {
                        Authorization: token
                    },
                    timeout: 5000
                }
            );
        } catch (notifErr) {
            console.warn('Failed to send enrollment notification:', notifErr.message); // eslint-disable-line no-console
        }

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in course',
            data: { enrollment },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /courses/my
 * Get all courses the authenticated student is enrolled in.
 * This endpoint is also called by the Timetable Service (inter-service).
 */
const getMyEnrollments = async (req, res, next) => {
    try {
        const studentId = req.user.studentId || req.query.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required',
            });
        }

        const enrollments = await Enrollment.find({
            studentId,
            status: 'enrolled',
        }).populate('courseId');

        res.status(200).json({
            success: true,
            data: {
                enrollments,
                count: enrollments.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /courses/enroll/:courseId
 * Drop (unenroll from) a course.
 */
const dropCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { studentId } = req.user;

        const enrollment = await Enrollment.findOneAndUpdate(
            { studentId, courseId, status: 'enrolled' },
            { status: 'dropped' },
            { new: true }
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found',
            });
        }

        // Decrement enrollment count
        await Course.findByIdAndUpdate(courseId, {
            $inc: { currentEnrollment: -1 },
        });

        res.status(200).json({
            success: true,
            message: 'Successfully dropped from course',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    getMyEnrollments,
    dropCourse,
};
