import app from './app';

// Use PORT environment variable for Cloud Run compatibility
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CRM Service running on port ${PORT}`);
});
