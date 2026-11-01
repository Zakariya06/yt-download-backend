const router = require('express').Router();
const validateUrl = require('../middleware/validateUrl');
const ctrl = require('../controllers/download.controller');

router.post('/start', validateUrl, ctrl.start);
router.get('/progress/:jobId', ctrl.progress);
router.get('/file/:jobId', ctrl.file);
module.exports = router;