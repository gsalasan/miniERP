<<<<<<< HEAD
import app from './app';
=======
<<<<<<< HEAD
import app from "./app"
>>>>>>> main

// Use explicit port for CRM service to avoid conflicts
const PORT = Number(process.env.CRM_PORT) || 3002;

app.listen(PORT, () => {
<<<<<<< HEAD
  // eslint-disable-next-line no-console
  console.log(`CRM Service running on port ${PORT}`);
});
=======
  console.log(`Server running on port ${PORT}`)
})
=======
import app from "./app";

// Use explicit port for CRM service to avoid conflicts
const PORT = Number(process.env.CRM_PORT) || 3002;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CRM Service running on port ${PORT}`);
});
>>>>>>> main
>>>>>>> main
