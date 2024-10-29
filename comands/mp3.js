const { MessageMedia } = require('whatsapp-web.js');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

// API key de YouTube
const YOUTUBE_API_KEY = 'AIzaSyD2i7hGk1gPYtTBjfOxWvoyM4rE7JY62nI';

// Función para buscar un video en YouTube
async function buscarVideoYoutube(nombreCancion) {
    const fetch = (await import('node-fetch')).default;
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(nombreCancion)}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
        } else {
            throw new Error('No se encontraron resultados en YouTube.');
        }
    } catch (error) {
        throw new Error(`Error en la búsqueda de YouTube: ${error.message}`);
    }
}

// Función para obtener metadatos del video
async function obtenerMetadatosVideo(videoUrl) {
    const ytdl = require('ytdl-core');
    try {
        const info = await ytdl.getInfo(videoUrl);
        const titulo = info.videoDetails.title;
        const autor = info.videoDetails.author.name;
        const vistas = info.videoDetails.viewCount;
        const duracion = info.videoDetails.lengthSeconds;
        const fechaPublicacion = info.videoDetails.uploadDate;
        const miniatura = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;
        const likes = info.videoDetails.likes;
        const descripcion = info.videoDetails.shortDescription;

        const minutos = Math.floor(duracion / 60);
        const segundos = duracion % 60;
        const duracionFormateada = `${minutos}:${segundos.toString().padStart(2, '0')}`;

        return { titulo, autor, vistas, duracionFormateada, miniatura, fechaPublicacion, likes, descripcion };
    } catch (error) {
        console.error('Error al obtener los metadatos del video:', error);
        throw error;
    }
}

// Función para descargar el MP3 con youtube-dl
async function descargarMP3ConYoutubeDL(nombreCancion, videoUrl) {
    const outputPath = path.join(__dirname, '../downloads', `${nombreCancion}.mp3`);

    try {
        await youtubedl(videoUrl, {
            output: outputPath,
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '128k',
        });

        return outputPath;
    } catch (error) {
        console.error('Error en la descarga del MP3 con youtube-dl:', error);
        throw error;
    }
}

// Función para manejar el comando .mp3
async function handleMP3Command(mensaje, chatId, client) {
    let nombreCancion = mensaje.replace('.mp3', '').trim();

    if (!nombreCancion) {
        await client.sendMessage(chatId, "⚠️ Proporciona el nombre de la canción para descargar.");
        return;
    }

    try {
        const videoUrl = await buscarVideoYoutube(nombreCancion);

        // Obtener los metadatos del video
        const { titulo, autor, vistas, duracionFormateada, miniatura, fechaPublicacion, likes, descripcion } = await obtenerMetadatosVideo(videoUrl);

        // Enviar mensaje de que está descargando la canción
        await client.sendMessage(chatId, `🎶 Descargando la canción *${titulo}*... Esto puede tardar unos segundos... ⏳`);

        // Descargar la canción como MP3 usando youtube-dl
        const mp3Path = await descargarMP3ConYoutubeDL(nombreCancion, videoUrl);

        if (fs.existsSync(mp3Path)) {
            // Primero enviar el mensaje de que se descargó la canción
            await client.sendMessage(chatId, "🎉 ¡Aquí tienes tu canción descargada! 🎶");

            // Después enviar la portada con el título, duración y más información
            const imageMedia = await MessageMedia.fromUrl(miniatura);
            await client.sendMessage(chatId, imageMedia, { caption: `🎶 *Título*: ${titulo}\n⏱ *Duración*: ${duracionFormateada}\n👤 *Autor*: ${autor}\n👁️ *Vistas*: ${vistas}\n👍 *Likes*: ${likes}\n🗓️ *Fecha de publicación*: ${fechaPublicacion}` });

            // Finalmente, enviar la canción en formato MP3
            const media = MessageMedia.fromFilePath(mp3Path);
            await client.sendMessage(chatId, media);

            fs.unlinkSync(mp3Path); // Eliminar el archivo después de enviarlo
        } else {
            await client.sendMessage(chatId, "⚠️ Hubo un problema al descargar el archivo MP3.");
        }
    } catch (error) {
        console.error('Error al procesar el MP3:', error);
        await client.sendMessage(chatId, `❌ Error al descargar la canción: ${error.message}`);
    }
}

module.exports = { handleMP3Command };
