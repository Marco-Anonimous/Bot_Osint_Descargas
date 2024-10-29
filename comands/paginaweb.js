const express = require('express');
const bodyParser = require('body-parser');
const client = require('../bot');  // Importar el cliente de WhatsApp desde bot.js

// Inicializamos la aplicación Express
const app = express();
app.use(bodyParser.json());

// Función para manejar el comando .paginaweb
async function handlePaginaWebCommand(mensaje, chatId, client) {
    const url = `https://marco-anonimous.github.io/PagesGPS/?chatId=${chatId}`;  // Reemplaza con la URL de tu página subida en GitHub Pages

    try {
        // Enviar el enlace al mismo chat
        await client.sendMessage(chatId, `Haz clic en este enlace para compartir tu ubicación: ${url}`);
        console.log(`Enlace enviado al chat ${chatId}: ${url}`);
    } catch (error) {
        console.error('Error al enviar el enlace:', error);
        await client.sendMessage(chatId, "Hubo un problema al enviar el enlace.");
    }
}

// --- Ruta para capturar la ubicación desde la URL ---
app.get('/capturar', async (req, res) => {
    const { lat, lon, chatId } = req.query;  // Desestructurar las variables

    // Log para verificar que los parámetros lleguen correctamente
    console.log('Recibida solicitud de ubicación:', { lat, lon, chatId });

    // Validar que los parámetros sean correctos
    if (!lat || !lon || !chatId) {
        console.error('Faltan parámetros requeridos: lat, lon o chatId.');
        return res.status(400).send('Latitud, longitud y chatId son requeridos.');
    }

    // Validar que lat y lon sean valores numéricos
    const latFloat = parseFloat(lat);
    const lonFloat = parseFloat(lon);

    if (isNaN(latFloat) || isNaN(lonFloat)) {
        console.error('Latitud o longitud no son números válidos.');
        return res.status(400).send('Latitud y longitud deben ser números válidos.');
    }

    // Crear el enlace de Google Maps con las coordenadas
    const mapsLink = `https://www.google.com/maps?q=${latFloat},${lonFloat}`;

    try {
        // Enviar la ubicación al chat de WhatsApp correspondiente
        await client.sendMessage(chatId, `Ubicación compartida: ${mapsLink}`);
        console.log(`Ubicación enviada al chat ${chatId}: ${mapsLink}`);
        res.send('Ubicación enviada correctamente.');
    } catch (error) {
        console.error('Error al enviar la ubicación por WhatsApp:', error);
        res.status(500).send('Error al enviar la ubicación.');
    }
});

// Iniciar el servidor en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

module.exports = { handlePaginaWebCommand };
