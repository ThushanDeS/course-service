const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');
const config = require('../src/config');

// Mock database connection and axios (auth service calls)
jest.mock('../src/config/database', () => jest.fn());
jest.mock('axios');
const axios = require('axios');

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let authToken;
const testUserId = new mongoose.Types.ObjectId().toString();

// Generate a valid test JWT
const generateTestToken = () => {
    return jwt.sign({ userId: testUserId }, config.jwt.secret, {
        expiresIn: '1h',
    });
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    authToken = generateTestToken();

    // Mock Auth Service validation response
    axios.get.mockResolvedValue({
        data: {
            valid: true,
            data: {
                userId: testUserId,
                email: 'john.doe@campus.edu',
                studentId: 'IT20123456',
                role: 'student',
                firstName: 'John',
                lastName: 'Doe',
            },
        },
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
});

const sampleCourse = {
    courseCode: 'SE4010',
    courseName: 'Current Trends in Software Engineering',
    description: 'Cloud computing, DevOps, and microservices',
    credits: 3,
    department: 'Computer Science',
    semester: 7,
    maxEnrollment: 100,
    instructor: 'Dr. Smith',
    schedule: {
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
        room: 'A101',
    },
};

describe('Course Service API', () => {
    // =============================================
    // Health Check
    // =============================================
    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.service).toBe('course-service');
            expect(res.body.status).toBe('healthy');
        });
    });

    // =============================================
    // Course CRUD
    // =============================================
    describe('POST /courses', () => {
        it('should create a course with valid data', async () => {
            const res = await request(app)
                .post('/courses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sampleCourse);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.course.courseCode).toBe('SE4010');
        });

        it('should return 400 for missing required fields', async () => {
            const res = await request(app)
                .post('/courses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ courseName: 'Incomplete Course' });

            expect(res.status).toBe(400);
        });

        it('should return 401 without auth token', async () => {
            const res = await request(app).post('/courses').send(sampleCourse);
            expect(res.status).toBe(401);
        });

        it('should return 409 for duplicate course code', async () => {
            await request(app)
                .post('/courses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sampleCourse);

            const res = await request(app)
                .post('/courses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sampleCourse);

            expect(res.status).toBe(409);
        });
    });

    describe('GET /courses', () => {
        beforeEach(async () => {
            await Course.create(sampleCourse);
            await Course.create({
                ...sampleCourse,
                courseCode: 'CS3042',
                courseName: 'Database Systems',
                semester: 5,
            });
        });

        it('should list all active courses', async () => {
            const res = await request(app).get('/courses');
            expect(res.status).toBe(200);
            expect(res.body.data.courses.length).toBe(2);
            expect(res.body.data.pagination).toBeDefined();
        });

        it('should filter by semester', async () => {
            const res = await request(app).get('/courses?semester=7');
            expect(res.status).toBe(200);
            expect(res.body.data.courses.length).toBe(1);
            expect(res.body.data.courses[0].courseCode).toBe('SE4010');
        });

        it('should search by name', async () => {
            const res = await request(app).get('/courses?search=Database');
            expect(res.status).toBe(200);
            expect(res.body.data.courses.length).toBe(1);
        });
    });

    describe('GET /courses/:id', () => {
        it('should return a course by ID', async () => {
            const course = await Course.create(sampleCourse);
            const res = await request(app).get(`/courses/${course._id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.course.courseCode).toBe('SE4010');
        });

        it('should return 404 for non-existent course', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/courses/${fakeId}`);
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /courses/:id', () => {
        it('should update a course', async () => {
            const course = await Course.create(sampleCourse);
            const res = await request(app)
                .put(`/courses/${course._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ courseName: 'Updated Course Name' });

            expect(res.status).toBe(200);
            expect(res.body.data.course.courseName).toBe('Updated Course Name');
        });
    });

    describe('DELETE /courses/:id', () => {
        it('should soft-delete a course', async () => {
            const course = await Course.create(sampleCourse);
            const res = await request(app)
                .delete(`/courses/${course._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);

            const deleted = await Course.findById(course._id);
            expect(deleted.isActive).toBe(false);
        });
    });

    // =============================================
    // Enrollment
    // =============================================
    describe('POST /courses/enroll', () => {
        let courseId;

        beforeEach(async () => {
            const course = await Course.create(sampleCourse);
            courseId = course._id.toString();
        });

        it('should enroll in a course', async () => {
            const res = await request(app)
                .post('/courses/enroll')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ courseId });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);

            const updatedCourse = await Course.findById(courseId);
            expect(updatedCourse.currentEnrollment).toBe(1);
        });

        it('should prevent double enrollment', async () => {
            await request(app)
                .post('/courses/enroll')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ courseId });

            const res = await request(app)
                .post('/courses/enroll')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ courseId });

            expect(res.status).toBe(409);
        });

        it('should prevent enrollment in full course', async () => {
            await Course.findByIdAndUpdate(courseId, {
                maxEnrollment: 1,
                currentEnrollment: 1,
            });

            const res = await request(app)
                .post('/courses/enroll')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ courseId });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /courses/my', () => {
        it('should return enrolled courses', async () => {
            const course = await Course.create(sampleCourse);
            await Enrollment.create({
                studentId: 'IT20123456',
                userId: testUserId,
                courseId: course._id,
            });

            const res = await request(app)
                .get('/courses/my')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.enrollments.length).toBe(1);
            expect(res.body.data.count).toBe(1);
        });
    });

    describe('DELETE /courses/enroll/:courseId', () => {
        it('should drop a course', async () => {
            const course = await Course.create({
                ...sampleCourse,
                currentEnrollment: 1,
            });
            await Enrollment.create({
                studentId: 'IT20123456',
                userId: testUserId,
                courseId: course._id,
            });

            const res = await request(app)
                .delete(`/courses/enroll/${course._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);

            const updatedCourse = await Course.findById(course._id);
            expect(updatedCourse.currentEnrollment).toBe(0);
        });
    });

    // =============================================
    // 404
    // =============================================
    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });
    });
});
