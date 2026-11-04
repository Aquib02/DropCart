const express = require('express');
const router = express.Router();
const {
  getPublishedLayout,
  getDraftLayout,
  saveDraftLayout,
  publishDraftLayout,
  getLayoutVersions,
  rollbackToVersion,
  compareDraftAndPublished
} = require('../controllers/homepageLayoutController');
const { protect } = require('../middleware/authMiddleware');

const allowAdminOrStaff = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role === 'admin' || req.user.role === 'staff')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Administrator or Staff permissions required' });
};

// Public: Fetch currently published layout
router.get('/published', getPublishedLayout);

// Protected Admin/Staff routes
router.get('/draft', protect, allowAdminOrStaff, getDraftLayout);
router.put('/draft', protect, allowAdminOrStaff, saveDraftLayout);
router.post('/publish', protect, allowAdminOrStaff, publishDraftLayout);
router.get('/versions', protect, allowAdminOrStaff, getLayoutVersions);
router.post('/rollback/:versionId', protect, allowAdminOrStaff, rollbackToVersion);
router.get('/compare', protect, allowAdminOrStaff, compareDraftAndPublished);

module.exports = router;
