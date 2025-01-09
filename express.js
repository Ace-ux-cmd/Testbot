const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Basic route
app.get('/', (req, res) => {
    res.send('Telegram Bot is running!');
});

// Function to start the server
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

module.exports = startServer;