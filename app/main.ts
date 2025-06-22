import fastify from 'fastify';

const app = fastify({ logger: true });

app.get('/api/health', async (request, reply) => {
  return { message: 'OK' };
});

const start = async () => {
  try {
    await app.listen({ port: 3030 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
