const { getVideoInfo } = require('../services/ytdlp.service');

exports.getInfo = async (req, res, next) => {
  try {
    res.json(await getVideoInfo(req.body.url));
  } catch (e) { next(e); }
};