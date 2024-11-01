const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    console.log('Test endpoint hit!');
    res.json({ message: 'Server is running!' });
});

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 