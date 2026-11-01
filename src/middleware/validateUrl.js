module.exports = (req, res, next) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  next();
};