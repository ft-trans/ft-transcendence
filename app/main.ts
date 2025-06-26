import Fastify from 'fastify';
import { resolve } from 'node:path';
import FastifyVite from '@fastify/vite';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

const app = Fastify({ logger: true });

app.get('/api/health', async (req, reply) => {
  return { message: 'OK' };
});

const start = async () => {
  try {
    await app.register(FastifyVite, {
      root: resolve(import.meta.dirname, '..'),
      distDir: resolve(import.meta.dirname, '..'),
      dev: process.argv.includes("--dev"),
      spa: true,
    });

    app.get('/', (req, reply) => {
      return reply.html()
    })

    app.get('/api/users', async (req, reply) => {
      try {
        const users = await prisma.user.findMany();
        return users;
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: 'Failed to fetch users' });
      }
    });

    app.post('/api/users', async (req, reply) => {
      const { email } = req.body as { email: string };
      if (!email) {
        return reply.status(400).send({ error: 'Email is required' });
      }
      try {
        const user = await prisma.user.create({
          data: { email },
        });
        return user;
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: 'Failed to create user' });
      }
    });

    await app.vite.ready();
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
