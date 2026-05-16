// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middleware/auth');
// const Progress = require('../models/Progress');
// const Course = require('../models/Course');

// router.use(protect);

// router.get('/dashboard', async (req, res) => {
//   try {
//     const progresses = await Progress.find({ student: req.user._id }).populate('course','title resources thumbnail');
//     const summary = { totalCourses: progresses.length, completedCourses: 0, totalResources: 0, completedResources: 0, courses: [] };
//     progresses.forEach(p => {
//       const total = p.course.resources.length, completed = p.completedResources.length;
//       const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
//       if (pct === 100) summary.completedCourses++;
//       summary.totalResources += total; summary.completedResources += completed;
//       summary.courses.push({ _id: p.course._id, title: p.course.title, thumbnail: p.course.thumbnail, percentage: pct, lastAccessed: p.lastAccessed });
//     });
//     res.json(summary);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// router.get('/progress', async (req, res) => {
//   try {
//     const progresses = await Progress.find({ student: req.user._id }).populate('course','title description resources thumbnail');
//     res.json(progresses.map(p => ({
//       _id: p._id,
//       course: p.course,
//       totalResources: p.course.resources.length,
//       completedResources: p.completedResources.length,
//       percentage: p.course.resources.length > 0 ? Math.round((p.completedResources.length / p.course.resources.length) * 100) : 0,
//       completedResourceIds: p.completedResources.map(r => r.resourceId.toString()),
//       lastAccessed: p.lastAccessed, startedAt: p.startedAt
//     })));
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// router.get('/progress/:courseId', async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.courseId);
//     if (!course) return res.status(404).json({ message: 'Course not found' });
//     let p = await Progress.findOne({ student: req.user._id, course: req.params.courseId });
//     if (!p) p = await Progress.create({ student: req.user._id, course: req.params.courseId, completedResources: [] });
//     res.json({
//       totalResources: course.resources.length,
//       completedResources: p.completedResources.length,
//       percentage: course.resources.length > 0 ? Math.round((p.completedResources.length / course.resources.length) * 100) : 0,
//       completedResourceIds: p.completedResources.map(r => r.resourceId.toString()),
//       lastAccessed: p.lastAccessed
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// router.post('/progress/:courseId/complete/:resourceId', async (req, res) => {
//   try {
//     let p = await Progress.findOne({ student: req.user._id, course: req.params.courseId });
//     if (!p) p = await Progress.create({ student: req.user._id, course: req.params.courseId, completedResources: [] });
//     const already = p.completedResources.some(r => r.resourceId.toString() === req.params.resourceId);
//     if (!already) p.completedResources.push({ resourceId: req.params.resourceId });
//     p.lastAccessed = Date.now();
//     await p.save();
//     const course = await Course.findById(req.params.courseId);
//     res.json({
//       message: already ? 'Already completed' : 'Marked complete',
//       percentage: course.resources.length > 0 ? Math.round((p.completedResources.length / course.resources.length) * 100) : 0,
//       completedResourceIds: p.completedResources.map(r => r.resourceId.toString())
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Progress = require('../models/Progress');
const Course = require('../models/Course');

router.use(protect);

router.get('/dashboard', async (req, res) => {
  try {
    const progresses = await Progress.find({ student: req.user._id })
      .populate('course', 'title resources thumbnail');

    const summary = {
      totalCourses: 0,
      completedCourses: 0,
      totalResources: 0,
      completedResources: 0,
      courses: []
    };

    for (const p of progresses) {
      // Guard: skip if course was deleted
      if (!p.course) continue;

      const total = p.course.resources ? p.course.resources.length : 0;
      const completed = p.completedResources ? p.completedResources.length : 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      summary.totalCourses++;
      if (pct === 100) summary.completedCourses++;
      summary.totalResources += total;
      summary.completedResources += completed;
      summary.courses.push({
        _id: p.course._id,
        title: p.course.title,
        thumbnail: p.course.thumbnail || '',
        percentage: pct,
        lastAccessed: p.lastAccessed
      });
    }

    res.json(summary);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const progresses = await Progress.find({ student: req.user._id })
      .populate('course', 'title description resources thumbnail');

    const result = [];
    for (const p of progresses) {
      // Guard: skip if course was deleted
      if (!p.course) continue;

      const totalResources = p.course.resources ? p.course.resources.length : 0;
      const completedResources = p.completedResources ? p.completedResources.length : 0;

      result.push({
        _id: p._id,
        course: p.course,
        totalResources,
        completedResources,
        percentage: totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0,
        completedResourceIds: p.completedResources.map(r => r.resourceId.toString()),
        lastAccessed: p.lastAccessed,
        startedAt: p.startedAt
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/progress/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let p = await Progress.findOne({ student: req.user._id, course: req.params.courseId });
    if (!p) {
      p = await Progress.create({
        student: req.user._id,
        course: req.params.courseId,
        completedResources: []
      });
    }

    const totalResources = course.resources ? course.resources.length : 0;
    const completedResources = p.completedResources ? p.completedResources.length : 0;

    res.json({
      totalResources,
      completedResources,
      percentage: totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0,
      completedResourceIds: p.completedResources.map(r => r.resourceId.toString()),
      lastAccessed: p.lastAccessed
    });
  } catch (err) {
    console.error('Progress by course error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/progress/:courseId/complete/:resourceId', async (req, res) => {
  try {
    let p = await Progress.findOne({ student: req.user._id, course: req.params.courseId });
    if (!p) {
      p = await Progress.create({
        student: req.user._id,
        course: req.params.courseId,
        completedResources: []
      });
    }

    const already = p.completedResources.some(
      r => r.resourceId.toString() === req.params.resourceId
    );
    if (!already) p.completedResources.push({ resourceId: req.params.resourceId });
    p.lastAccessed = Date.now();
    await p.save();

    const course = await Course.findById(req.params.courseId);
    const total = course ? course.resources.length : 0;

    res.json({
      message: already ? 'Already completed' : 'Marked complete',
      percentage: total > 0 ? Math.round((p.completedResources.length / total) * 100) : 0,
      completedResourceIds: p.completedResources.map(r => r.resourceId.toString())
    });
  } catch (err) {
    console.error('Complete resource error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
