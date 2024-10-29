const fs = require('fs');
const path = require('path');

const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fetch = require('node-fetch');
const { getInfo } = require('ytdl-core');

// Tu clave de API de YouTube (si usas la funcionalidad de MP3)
const YOUTUBE_API_KEY = 'AIzaSyARLX_vC4X21AU5zDhoL_aQbummNIcv39U';

// Función para buscar el video de YouTube por nombre de la canción
async function buscarVideoYoutube(nombreCancion) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(nombreCancion)}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
        return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
    } else {
        throw new Error('No se encontraron resultados en YouTube.');
    }
}

// Función para descargar MP3 a partir del nombre de la canción
async function descargarMP3(nombreCancion) {
    try {
        const videoUrl = await buscarVideoYoutube(nombreCancion); // Obtener el enlace del video de YouTube
        const info = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        
        const outputPath = path.join(__dirname, '../downloads', `${nombreCancion}.mp3`);
        
        return new Promise((resolve, reject) => {
            ffmpeg(ytdl(videoUrl, { filter: 'audioonly' }))
                .audioBitrate(128)
                .save(outputPath)
                .on('end', () => {
                    console.log('MP3 descargado correctamente:', outputPath);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    } catch (error) {
        console.error('Error al descargar el MP3:', error);
        throw new Error('Error al descargar el MP3.');
    }
}
module.exports = { descargarMP3};
