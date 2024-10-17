import userOps from '../controllers/user.js';
import accountOps from '../controllers/account.js';
import transactionOps from '../controllers/transaction.js';

import express from 'express';
const app = express();

app.use('/api/v1/users', userOps);
app.use('/api/v1/accounts', accountOps);
app.use('/api/v1/transactions', transactionOps);

export default app;