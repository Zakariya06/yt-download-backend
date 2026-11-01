const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1); // required behind Render/Railway proxies

app.use(helmet());
app.use(cors({ origin: env.corsOrigins.includes('*') ? true : env.corsOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, max: 60 }));

app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;