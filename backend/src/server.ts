import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}/api`);
});
