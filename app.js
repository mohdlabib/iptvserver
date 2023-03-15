const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

function downloadImages() {
  // Hapus isi folder images
  fs.readdirSync('images').forEach(file => fs.unlinkSync(`images/${file}`));

  // URL file M3U
  const url = 'https://iptv-org.github.io/iptv/countries/id.m3u';

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

setInterval(() => {
  downloadImages();
}, 30 * 60 * 1000);
