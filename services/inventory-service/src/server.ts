import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, service: 'inventory-service' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Inventory service listening on port ${port}`);
});


