import express = require('express');
import materialsRoutes from './routes/materialsRoutes';
<<<<<<< HEAD
import serviceRoutes from './routes/serviceRoutes';
import searchRoutes from './routes/searchRoutes';
=======
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987

const app = express();
app.use(express.json());

<<<<<<< HEAD
// mount engineering-related routes (search) - more specific routes first
app.use('/', searchRoutes);

// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

// mount engineering-related routes (services)
app.use('/', serviceRoutes);

=======
// mount engineering-related routes (materials)
app.use('/', materialsRoutes);

>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987
export default app;
