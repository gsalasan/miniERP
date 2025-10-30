import express from 'express';

const app = express();

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ success: true, service: 'project-service' });
});

const port: number = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Project service listening on port ${port}`);
});


