const mongoose = require('mongoose');
const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedResources: [{ resourceId: { type: mongoose.Schema.Types.ObjectId, required: true }, completedAt: { type: Date, default: Date.now } }],
  lastAccessed: { type: Date, default: Date.now },
  startedAt: { type: Date, default: Date.now }
});
progressSchema.index({ student: 1, course: 1 }, { unique: true });
module.exports = mongoose.model('Progress', progressSchema);
