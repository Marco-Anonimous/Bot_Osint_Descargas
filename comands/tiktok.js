const axios = require('axios');
const fs = require('fs');
const path = require('path');

const handleTikTokCommand = async (mensaje, chatId, client) => {
    const url = mensaje.split(' ')[1];  // Extraer el enlace del mensaje

    if (!url || !url.match(/tiktok/gi)) {
        await client.sendMessage(chatId, '⚠️ Por favor, proporciona un enlace válido de TikTok.');
        return;
    }

    try {
        const options = {
            method: 'GET',
            url: 'https://tiktok-downloader-download-videos-without-watermark.p.rapidapi.com/media-info/', // Cambia este endpoint si es necesario
            params: { link: url },  // Enviar el enlace del video de TikTok
            headers: {
                'X-RapidAPI-Key': '89a36dc09cmshf27e1a0d77a030bp1af3ffjsn3bab03959dcb',  // Tu clave de API de RapidAPI
                'X-RapidAPI-Host': 'tiktok-downloader-download-videos-without-watermark.p.rapidapi.com'
            },
            responseType: 'stream'  // Esto permitirá que descarguemos el video en forma de stream
        };

        const response = await axios.request(options);

        if (response.status === 200 && response.data) {
            const videoPath = path.resolve(__dirname, '../temp', 'video-tiktok.mp4'); // Ruta donde se guardará el video

            // Crear un stream de escritura en el archivo de destino
            const writer = fs.createWriteStream(videoPath);

            // Escribir el video en el archivo
            response.data.pipe(writer);

            writer.on('finish', async () => {
                await client.sendMessage(chatId, '🎥 Video descargado con éxito y guardado en la carpeta temp.');
                await client.sendMessage(chatId, { video: fs.createReadStream(videoPath), caption: '🎥 Aquí tienes tu video de TikTok.' });
            });

            writer.on('error', async (err) => {
                console.error('Error escribiendo el archivo:', err);
                await client.sendMessage(chatId, '⚠️ Hubo un error al guardar el video. Intenta nuevamente.');
            });

        } else {
            await client.sendMessage(chatId, '⚠️ No se pudo descargar el video. Por favor, intenta con otro enlace.');
        }

    } catch (error) {
        console.error('Error descargando video de TikTok:', error);
        await client.sendMessage(chatId, '⚠️ Hubo un error al intentar descargar el video de TikTok. Por favor, intenta nuevamente.');
    }
};

module.exports = { handleTikTokCommand };
