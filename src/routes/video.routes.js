const router = require('express').Router();
const validateUrl = require('../middleware/validateUrl');
const ctrl = require('../controllers/video.controller');

router.post('/info', validateUrl, ctrl.getInfo);
module.exports = router;