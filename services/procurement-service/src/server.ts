import app from './app';

const PORT = Number(process.env.PROCUREMENT_PORT) || 4006;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Procurement Service running on port ${PORT}`);
});