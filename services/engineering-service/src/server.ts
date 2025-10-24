import app from './app';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {

  // eslint-disable-next-line no-console
  console.log(`Engineering service listening on port ${PORT}`);
});
