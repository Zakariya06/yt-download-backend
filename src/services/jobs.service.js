const crypto = require('crypto');
const { jobTtlMs } = require('../config/env');

const jobs = new Map();

function createJob() {
  const job = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'downloading',
    progress: { percent: 0, downloaded: 0, total: 0, speed: 0, eta: 0 },
    filePath: null,
    error: null,
    sseClients: new Set(),
  };
  jobs.set(job.id, job);
  return job;
}

const getJob = (id) => jobs.get(id);
const deleteJob = (id) => jobs.delete(id);

function broadcast(job, data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  job.sseClients.forEach((res) => res.write(payload));
}

// Fixed: your old version parsed the UUID as a timestamp, which never worked
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (['done', 'error'].includes(job.status) && now - job.createdAt > jobTtlMs) {
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000).unref();

module.exports = { createJob, getJob, deleteJob, broadcast };