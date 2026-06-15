import { Hono } from 'hono';
import { cors } from "hono/cors";
import health from './routes/health';
import onboard from './routes/onboard';
import audit from './routes/audit';
import delegate from './routes/delegate';
import hospital from './routes/hospital';

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }, 200))
  .get('/health-check', (c) => c.json({ status: 'ok', service: 'T3 MedAgent' }, 200))
  .route('/health', health)
  .route('/onboard', onboard)
  .route('/audit', audit)
  .route('/delegate', delegate)
  .route('/hospital', hospital);

export type AppType = typeof app;
export default app;
