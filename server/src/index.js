import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => console.info(`GitHub portfolio API listening on http://localhost:${env.port}`));
