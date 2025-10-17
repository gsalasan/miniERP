import express = require('express');
import authRoutes from './routes/auth.routes';
import materialsRoutes from './routes/materialsRoutes';

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

export default app;
