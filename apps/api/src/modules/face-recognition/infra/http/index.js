import express from 'express';
import faceRouter from './controllers/face.controller.js';

function mountFace(app){
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', faceRouter);
}
export { mountFace };
