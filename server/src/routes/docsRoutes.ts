import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from '../docs/openapi.js';

export const docsRouter = Router();

// Serve raw OpenAPI JSON specification for tool ingestion / Postman import
docsRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openApiSpec);
});

docsRouter.get('/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openApiSpec);
});

// Serve interactive Swagger UI at /api/docs
docsRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'The Bombay Reserve API Documentation',
    customCss: '.swagger-ui .topbar { background-color: #1a1714; border-bottom: 2px solid #b89758; } .swagger-ui .topbar-wrapper img { content: url("https://images.unsplash.com/photo-1542314831-c6a4d27f8842?w=80"); }',
  })
);
