import express from 'express';
import { getChartOfAccounts } from './src/controllers/chartofaccounts.controllers';

const app = express();
app.use(express.json());

app.get('/test-coa', getChartOfAccounts);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/test-coa`);
});
