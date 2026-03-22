const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');
const {
    validate,
    createCourseSchema,
    updateCourseSchema,
    enrollSchema,
} = require('../validators/courseValidator');

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: List all available courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 *         description: Filter by semester
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by course name or code
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of courses with pagination
 */
router.get('/', courseController.getAllCourses);

/**
 * @swagger
 * /courses/my:
 *   get:
 *     summary: Get enrolled courses for the authenticated student
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled courses
 *       401:
 *         description: Unauthorized
 */
router.get('/my', authenticate, courseController.getMyEnrollments);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', courseController.getCourseById);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseCode
 *               - courseName
 *               - credits
 *               - department
 *               - semester
 *             properties:
 *               courseCode:
 *                 type: string
 *                 example: SE4010
 *               courseName:
 *                 type: string
 *                 example: Current Trends in Software Engineering
 *               description:
 *                 type: string
 *               credits:
 *                 type: integer
 *                 example: 3
 *               department:
 *                 type: string
 *                 example: Computer Science
 *               semester:
 *                 type: integer
 *                 example: 7
 *               maxEnrollment:
 *                 type: integer
 *                 example: 100
 *               instructor:
 *                 type: string
 *               schedule:
 *                 type: object
 *                 properties:
 *                   day:
 *                     type: string
 *                     enum: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *                   room:
 *                     type: string
 *     responses:
 *       201:
 *         description: Course created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Course code already exists
 */
router.post(
    '/',
    authenticate,
    validate(createCourseSchema),
    courseController.createCourse
);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseName:
 *                 type: string
 *               description:
 *                 type: string
 *               credits:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Course updated
 *       404:
 *         description: Course not found
 */
router.put(
    '/:id',
    authenticate,
    validate(updateCourseSchema),
    courseController.updateCourse
);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete (deactivate) a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted
 *       404:
 *         description: Course not found
 */
router.delete('/:id', authenticate, courseController.deleteCourse);

/**
 * @swagger
 * /courses/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *       400:
 *         description: Course is full
 *       404:
 *         description: Course not found
 *       409:
 *         description: Already enrolled
 */
router.post(
    '/enroll',
    authenticate,
    validate(enrollSchema),
    courseController.enrollInCourse
);

/**
 * @swagger
 * /courses/enroll/{courseId}:
 *   delete:
 *     summary: Drop a course
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dropped successfully
 *       404:
 *         description: Enrollment not found
 */
router.delete('/enroll/:courseId', authenticate, courseController.dropCourse);

module.exports = router;
