# Gunakan image Node.js versi 14 sebagai base image
FROM node:16

# Buat direktori kerja
WORKDIR /app

# Salin package.json dan package-lock.json ke direktori kerja
COPY package*.json ./

# Install dependencies
RUN npm install

RUN apt-get update && \
    apt-get install -y ffmpeg

# Salin seluruh file ke direktori kerja
COPY . .

# Expose port 3000
EXPOSE 3000

# Jalankan aplikasi ketika container dijalankan
CMD ["npm", "start"]