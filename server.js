const express = require('express');
const fs = require('fs');
const http = require('http');

const port = process.env.PORT || 1720
const apiKey = '12344321'; // definisikan API key yang valid

const app = express();

app.get('/', (req, res) => {
  // Periksa apakah parameter API key diberikan dan valid
  const requestApiKey = req.query.apikey;
  if (requestApiKey !== apiKey) {
    res.status(401).send('API key tidak valid.');
  } else {
    // Baca file JSON
    fs.readFile('playlist.json', 'utf8', (err, data) => {
      if (err) {
        // Tangani kesalahan jika gagal membaca file
        console.error(err);
        res.status(500).send('Terjadi kesalahan pada server.');
      } else {
        // Kirim data JSON sebagai respons HTTP
        res.status(200).json(JSON.parse(data));
      }
    });
  }
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server berjalan pada port ${port}`);
});