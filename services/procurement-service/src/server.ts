import app from './app';

const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  console.log(`Procurement Service listening on port ${PORT}`);
});
