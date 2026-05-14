const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');

router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const totalProgress = await Progress.countDocuments();
    const recentStudents = await User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt');
    res.json({ totalStudents, totalCourses, totalProgress, recentStudents });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').populate('enrolledCourses','title');
    res.json(students);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/students/:id/progress', async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const progresses = await Progress.find({ student: req.params.id }).populate('course','title resources');
    const progress = progresses.map(p => ({
      course: { _id: p.course._id, title: p.course.title },
      totalResources: p.course.resources.length,
      completedResources: p.completedResources.length,
      percentage: p.course.resources.length > 0 ? Math.round((p.completedResources.length / p.course.resources.length) * 100) : 0,
      completedResourceIds: p.completedResources.map(r => r.resourceId.toString()),
      lastAccessed: p.lastAccessed, startedAt: p.startedAt
    }));
    res.json({ student, progress });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/progress', async (req, res) => {
  try {
    const all = await Progress.find().populate('student','name email').populate('course','title resources');
    res.json(all.map(p => ({
      student: p.student,
      course: { _id: p.course._id, title: p.course.title },
      totalResources: p.course.resources.length,
      completed: p.completedResources.length,
      percentage: p.course.resources.length > 0 ? Math.round((p.completedResources.length / p.course.resources.length) * 100) : 0,
      lastAccessed: p.lastAccessed
    })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/enroll', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const [student, course] = await Promise.all([User.findById(studentId), Course.findById(courseId)]);
    if (!student || !course) return res.status(404).json({ message: 'Student or course not found' });
    if (!course.enrolledStudents.includes(studentId)) { course.enrolledStudents.push(studentId); await course.save(); }
    if (!student.enrolledCourses.includes(courseId)) { student.enrolledCourses.push(courseId); await student.save(); }
    await Progress.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $setOnInsert: { student: studentId, course: courseId, completedResources: [] } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Enrolled successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/enroll/:studentId/:courseId', async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    await User.findByIdAndUpdate(studentId, { $pull: { enrolledCourses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $pull: { enrolledStudents: studentId } });
    res.json({ message: 'Unenrolled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
