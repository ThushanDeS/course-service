const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        courseCode: {
            type: String,
            required: [true, 'Course code is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        courseName: {
            type: String,
            required: [true, 'Course name is required'],
            trim: true,
            maxlength: [200, 'Course name cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        credits: {
            type: Number,
            required: [true, 'Credits are required'],
            min: [1, 'Credits must be at least 1'],
            max: [6, 'Credits cannot exceed 6'],
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
        },
        semester: {
            type: Number,
            required: [true, 'Semester is required'],
            min: 1,
            max: 8,
        },
        maxEnrollment: {
            type: Number,
            default: 100,
            min: 1,
        },
        currentEnrollment: {
            type: Number,
            default: 0,
            min: 0,
        },
        instructor: {
            type: String,
            trim: true,
        },
        schedule: {
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            },
            startTime: String,
            endTime: String,
            room: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
