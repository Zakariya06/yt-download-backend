const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const logger = require('../utils/logger');
const { buildFormatList } = require('../utils/formats');
const { broadcast } = require('./jobs.service');

if (!fs.existsSync(env.downloadDir)) fs.mkdirSync(env.downloadDir, { recursive: true });

function getVideoInfo(url) {
  const args = ['-j', '--no-playlist', '--no-warnings', '--compat-opt', 'manifest-filesize-approx', url];
  return new Promise((resolve, reject) => {
    execFile(env.ytdlpPath, args, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        logger.error('yt-dlp info:', stderr || err.message);
        return reject(new Error('Failed to fetch video info.'));
      }
      try {
        const info = JSON.parse(stdout);
        const duration = info.duration || 0;
        resolve({
          title: info.title,
          thumbnail: info.thumbnail,
          duration,
          formats: buildFormatList(info.formats || [], duration),
        });
      } catch {
        reject(new Error('Failed to parse video information.'));
      }
    });
  });
}

function startDownload(job, url, formatId) {
  const baseName = `video_${Date.now()}`;
  const output = path.join(env.downloadDir, `${baseName}.%(ext)s`);

  const args = [
    '-f', formatId || 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b',
    ...(env.ffmpegDir ? ['--ffmpeg-location', env.ffmpegDir] : []),
    '--merge-output-format', 'mp4',
    '--no-playlist',
    '-N', env.concurrentFragments,
    '--retries', '10',
    '--fragment-retries', '10',
    '--socket-timeout', '15',
    '--newline',
    '--progress-template',
    'download:PROGRESS|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.speed)s|%(progress.eta)s',
    '-o', output,
    url,
  ];

  const child = spawn(env.ytdlpPath, args);
  let stderrBuf = '';

  const handleLine = (line) => {
    if (!line) return;
    if (line.startsWith('PROGRESS|')) {
      const [, d, t, s, e] = line.split('|');
      const downloaded = parseInt(d, 10) || 0;
      const total = parseInt(t, 10) || job.progress.total || 0;
      job.progress = {
        percent: total > 0 ? Math.min((downloaded / total) * 100, 100) : 0,
        downloaded,
        total,
        speed: parseFloat(s) || 0,
        eta: parseInt(e, 10) || 0,
      };
      job.status = 'downloading';
      broadcast(job, { type: 'progress', ...job.progress, status: job.status });
    } else if (line.includes('[Merger]') || line.includes('[ffmpeg]')) {
      job.status = 'merging';
      broadcast(job, { type: 'status', status: 'merging' });
    }
  };

  child.stdout.on('data', (d) => d.toString().split('\n').forEach(handleLine));
  child.stderr.on('data', (d) => { stderrBuf += d.toString(); });

  child.on('error', (err) => {          // e.g. yt-dlp binary not found
    job.status = 'error';
    job.error = `Cannot start yt-dlp: ${err.message}`;
    broadcast(job, { type: 'error', error: job.error });
  });

  child.on('close', (code) => {
    if (code === 0) {
      const filePath = ['mp4', 'webm', 'mkv']
        .map((ext) => path.join(env.downloadDir, `${baseName}.${ext}`))
        .find(fs.existsSync);
      if (filePath) {
        job.status = 'done';
        job.filePath = filePath;
        job.progress.percent = 100;
        return broadcast(job, { type: 'done', status: 'done', downloadUrl: `/api/download/file/${job.id}` });
      }
      job.error = 'Output file not found';
    } else {
      logger.error('yt-dlp failed', code, stderrBuf);
      job.error = (stderrBuf.trim().split('\n').slice(-3).join(' ') || `yt-dlp exited with code ${code}`).slice(0, 400);
    }
    job.status = 'error';
    broadcast(job, { type: 'error', error: job.error });
  });
}

function getVersions() {
  const run = (bin, args) =>
    new Promise((resolve) =>
      execFile(bin, args, (err, out) => resolve(err ? { found: false, error: err.message } : { found: true, version: out.split('\n')[0].trim() }))
    );
  const ffmpeg = env.ffmpegDir ? path.join(env.ffmpegDir, 'ffmpeg') : 'ffmpeg';
  return Promise.all([run(env.ytdlpPath, ['--version']), run(ffmpeg, ['-version'])])
    .then(([ytdlp, ff]) => ({ ytdlp, ffmpeg: ff }));
}

module.exports = { getVideoInfo, startDownload, getVersions };