import { createApp } from './app.js';
import { config } from './config.js';
import { startNewsJob } from './modules/news/news.service.js';

createApp().listen(config.port, () => {
  console.log(`🌱 Verdejar API em http://localhost:${config.port}/api`);
  startNewsJob(config.newsRefreshMinutes);
});
