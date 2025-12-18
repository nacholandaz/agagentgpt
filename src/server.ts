import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import { CONFIG } from './config.js';
import { registerInboundEmailRoute } from './routes/inboundEmail.js';
import { registerAcceptInviteRoute } from './routes/acceptInvite.js';
import { registerEmailSimulatorRoute } from './routes/emailSimulator.js';

const fastify = Fastify({
  logger: true,
});

// Start server
const start = async () => {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: true,
    });

    await fastify.register(formbody);

    // Register routes
    await fastify.register(registerInboundEmailRoute);
    await fastify.register(registerAcceptInviteRoute);
    await fastify.register(registerEmailSimulatorRoute);

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok' };
    });

    await fastify.listen({ port: CONFIG.port, host: '0.0.0.0' });
    console.log(`Server listening on http://0.0.0.0:${CONFIG.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

