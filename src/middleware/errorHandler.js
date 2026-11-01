const logger = require('../utils/logger');

exports.notFound = (req, res) => res.status(404).json({ error: 'Route not found' });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  logger.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};