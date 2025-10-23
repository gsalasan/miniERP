import express = require('express');
import materialsRoutes from './routes/materialsRoutes';
import serviceRoutes from './routes/serviceRoutes';

const app = express();
app.use(express.json());

// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

// mount engineering-related routes (services)
app.use('/', serviceRoutes);

export default app;
