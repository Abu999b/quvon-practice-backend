const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Course = require('../models/Course');

router.get('/', protect, async (req, res) => {
  try {
    const courses = req.user.role === 'admin'
      ? await Course.find().populate('createdBy','name').populate('enrolledStudents','name email')
      : await Course.find({ enrolledStudents: req.user._id });
    res.json(courses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('createdBy','name').populate('enrolledStudents','name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role === 'student' && !course.enrolledStudents.some(s => s._id.toString() === req.user._id.toString()))
      return res.status(403).json({ message: 'Not enrolled in this course' });
    res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, thumbnail, tags } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const course = await Course.create({ title, description, thumbnail, tags: tags||[], createdBy: req.user._id });
    res.status(201).json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try { await Course.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/resources', protect, adminOnly, async (req, res) => {
  try {
    const { title, url, type, description, order } = req.body;
    if (!title || !url) return res.status(400).json({ message: 'Title and URL required' });
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.resources.push({ title, url, type: type||'article', description, order: order||course.resources.length });
    await course.save(); res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/resources/:rid', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const r = course.resources.id(req.params.rid);
    if (!r) return res.status(404).json({ message: 'Resource not found' });
    Object.assign(r, req.body); await course.save(); res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/resources/:rid', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.resources = course.resources.filter(r => r._id.toString() !== req.params.rid);
    await course.save(); res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
