import express = require('express');
import materialsRoutes from './routes/materialsRoutes';
import serviceRoutes from './routes/serviceRoutes';
import searchRoutes from './routes/searchRoutes';

const app = express();
app.use(express.json());

// mount engineering-related routes (search) - more specific routes first
app.use('/', searchRoutes);

// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

// mount engineering-related routes (services)
app.use('/', serviceRoutes);

export default app;
