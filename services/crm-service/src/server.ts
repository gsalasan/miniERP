import app from "./app";

// Use explicit port for CRM service to avoid conflicts
const PORT = Number(process.env.CRM_PORT) || 3002;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CRM Service running on port ${PORT}`);
});
