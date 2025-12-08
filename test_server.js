const express = require('express');
const app = express();
const PORT = 5002;

app.get('/', (req, res) => res.send('Hello'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test Server running on port ${PORT}`);
});
