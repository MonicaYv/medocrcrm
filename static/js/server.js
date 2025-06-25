const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow all origins

// Proxy route
app.get('/api/search-medicines', async (req, res) => {
  const query = req.query.q || '';
  const apiUrl = `http://122.170.111.109:6184/enduser/search-medicines/?q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(apiUrl);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
