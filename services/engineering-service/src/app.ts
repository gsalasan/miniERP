import express = require('express');
import materialsRoutes from './routes/materialsRoutes';

const app = express();
app.use(express.json());

// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

export default app;
