const router = require('express').Router();

router.use('/', require('./health.routes'));
router.use('/api', require('./video.routes'));          // POST /api/info
router.use('/api/download', require('./download.routes'));

module.exports = router;