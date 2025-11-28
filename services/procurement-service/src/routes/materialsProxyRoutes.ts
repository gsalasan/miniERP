import express from 'express';
import axios from 'axios';

const router = express.Router();

// Proxy endpoint to get materials from engineering-service
router.get('/api/materials', async (req, res) => {
  try {
    const token = req.headers.authorization;
    // Ganti ke port 4001 sesuai engineering-service
    const response = await axios.get('http://localhost:4001/api/v1/materials', {
      headers: { Authorization: token }
    });
    // Return only the data array if present, else the whole response
    res.json(response.data.data || response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;