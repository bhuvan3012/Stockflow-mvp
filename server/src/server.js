require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Base health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'StockFlow MVP API',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`StockFlow Server listening on http://localhost:${PORT}`);
});
