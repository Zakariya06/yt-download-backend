require('dotenv').config();
const path = require('path');

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3001,
  ytdlpPath: process.env.YTDLP_PATH || 'yt-dlp',   // on a server it's just "yt-dlp"
  ffmpegDir: process.env.FFMPEG_DIR || '',          // empty = use ffmpeg from PATH
  downloadDir: path.resolve(process.env.DOWNLOAD_DIR || './downloads'),
  corsOrigins: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim()),
  concurrentFragments: process.env.CONCURRENT_FRAGMENTS || '8',
  jobTtlMs: (Number(process.env.JOB_TTL_MINUTES) || 30) * 60 * 1000,
};