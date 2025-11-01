import app from './app';

const PORT = Number(process.env.PROCUREMENT_PORT) || 3003;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Procurement Service running on port ${PORT}`);
});
