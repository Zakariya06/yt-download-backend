const router = require('express').Router();
const ctrl = require('../controllers/health.controller');

router.get('/health', ctrl.health);
router.get('/check-ytdlp', ctrl.tools);
module.exports = router;