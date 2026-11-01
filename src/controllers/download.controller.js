const fs = require('fs');
const path = require('path');
const jobsSvc = require('../services/jobs.service');
const { startDownload } = require('../services/ytdlp.service');

exports.start = (req, res) => {
  const { url, format_id } = req.body;
  const job = jobsSvc.createJob();
  startDownload(job, url, format_id);
  res.json({ jobId: job.id });
};

exports.progress = (req, res) => {
  const job = jobsSvc.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  job.sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: 'init', ...job.progress, status: job.status })}\n\n`);

  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ping);
    job.sseClients.delete(res);
  });
};

exports.file = (req, res) => {
  const job = jobsSvc.getJob(req.params.jobId);
  if (!job || !job.filePath) return res.status(404).json({ error: 'File not found' });

  const name = `video_${job.id}${path.extname(job.filePath)}`;
  res.download(job.filePath, name, () => {
    fs.unlink(job.filePath, () => {});
    jobsSvc.deleteJob(job.id);
  });
};