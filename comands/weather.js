// commands/weather.js
const axios = require('axios');

async function handleWeatherCommand(city, chatId, client) {
    try {
        const apiKey = '586ffdbc200c788b83b1c515a0dbc228'; // Tu clave API de Weatherstack
        const url = `http://api.weatherstack.com/current?access_key=${apiKey}&query=${encodeURIComponent(city)}&units=m`;
        const response = await axios.get(url);
        const data = response.data;

        if (data && data.current) {
            // Variables para mostrar información del clima de manera dinámica
            const location = data.location.name;
            const description = data.current.weather_descriptions[0];
            const temperature = data.current.temperature;
            const feelsLike = data.current.feelslike;
            const humidity = data.current.humidity;
            const windSpeed = data.current.wind_speed;
            const windDir = data.current.wind_dir;
            const icon = data.current.weather_icons[0];

            // Crear un mensaje dinámico con emojis y datos
            const weatherInfo = `
🌤 *Clima en ${location}:*
🌡 *Temperatura:* ${temperature}°C (Sensación térmica: ${feelsLike}°C)
💧 *Humedad:* ${humidity}%
💨 *Viento:* ${windSpeed} km/h desde ${windDir}
            `;

            await client.sendMessage(chatId, weatherInfo);
        } else {
            await client.sendMessage(chatId, '⚠️ No se pudo obtener la información del clima. Verifica la ciudad e intenta de nuevo.');
        }
    } catch (error) {
        console.error('Error al obtener el clima:', error);
        await client.sendMessage(chatId, '⚠️ Hubo un error al obtener la información del clima. Por favor, intenta de nuevo más tarde.');
    }
}

module.exports = { handleWeatherCommand };
