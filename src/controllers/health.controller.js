const { getVersions } = require('../services/ytdlp.service');

exports.health = (req, res) => res.json({ ok: true });
exports.tools = async (req, res, next) => {
  try { res.json(await getVersions()); } catch (e) { next(e); }
};