const axios = require('axios');
const express = require('express');
const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

const port = process.env.PORT || 3000
const apiKey = '1234'; // definisikan API key yang valid

const app = express();

function downloadImages() {
  // Hapus isi folder images
  fs.readdirSync('images').forEach(file => fs.unlinkSync(`images/${file}`));

  // URL file M3U
  const url = 'https://iptv-org.github.io/iptv/subdivisions/id-ri.m3u';

  // Ambil isi file M3U menggunakan Axios
  axios.get(url)
    .then(response => {
      // Pisahkan isi file berdasarkan baris baru
      const lines = response.data.trim().split('\n');

      // Filter baris yang berisi URL dan simpan dalam bentuk array
      const urls = lines.filter(line => line.startsWith('http')).map(url => url.trim());

      // Periksa setiap URL untuk memastikan bahwa dapat diakses
      const promises = urls.map(url => axios.get(url));

      Promise.allSettled(promises)
        .then(results => {
          // Buat daftar URL yang berhasil diakses
          const successUrls = results
            .filter(result => result.status === 'fulfilled')
            .map(result => ({ url: result.value.config.url, filename: `${uuidv4()}.jpg` }));

          // Tulis daftar URL yang berhasil diakses ke dalam file JSON
          fs.writeFile('playlist.json', JSON.stringify(successUrls), err => {
            if (err) throw err;
            console.log('Daftar URL berhasil disimpan dalam file playlist.json');

            // Download gambar dari setiap URL yang berhasil diakses dan simpan ke folder
            let numImagesDownloaded = 0;
            successUrls.forEach(({ url, filename }) => {
              const filePath = `images/${filename}`; // Tentukan path file

              // Eksekusi perintah ffmpeg untuk mengunduh gambar
              const command = `ffmpeg -y -i ${url} -frames:v 1 ${filePath}`;
              exec(command, (error, stdout, stderr) => {
                if (error) {
                  console.log(`Error saat mengunduh gambar dari ${url}: ${error.message}`);
                  return;
                }
                console.log(`Gambar ${filename} berhasil disimpan`);
                numImagesDownloaded++;

                // Jika sudah semua gambar berhasil diunduh, log selesai
                if (numImagesDownloaded === successUrls.length) {
                  console.log(`selesai pada ${new Date().toLocaleString()}`);
                }
              });
            });
          });
        })
        .catch(error => {
          console.log(`Error saat memeriksa URL: ${error.message}`);
        });
    })
    .catch(error => {
      console.log(`Error saat mengambil file M3U: ${error.message}`);
    });
}

downloadImages();

cron.schedule('0 */6 * * *', () => {
  downloadImages();
}, {
  scheduled: true,
  timezone: "Asia/Jakarta"
});

app.use(express.static('images'));

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