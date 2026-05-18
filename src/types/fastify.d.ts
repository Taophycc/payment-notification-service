export {};
declare module "fastify" {
  interface FastifyRequest {
    rawBody?: Buffer;
    user: {
      id: string;
      email: string;
    };
  }
}
