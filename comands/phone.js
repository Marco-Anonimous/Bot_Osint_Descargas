const axios = require('axios');
const twilio = require('twilio');

// Diccionario para mapear la compañía a marcas comerciales
const operadoraMap = {
    'Telefonica del Peru SAA': 'Movistar',
    'America Movil Peru SAC': 'Claro',
    'Entel Peru SA': 'Entel',
    'Viettel Peru S.A.C.': 'Bitel',
};

// Credenciales de Twilio
const accountSid = 'ACc5f07c4692077cb0ce4cd57576cb36cd';  // Reemplaza con tu Account SID de Twilio
const authToken = 'e868974eb847110ccb593ee95863a262';  // Reemplaza con tu Auth Token de Twilio
const clientTwilio = new twilio(accountSid, authToken);

// Función para verificar el nombre del llamante (Caller Name) usando Twilio Lookup API
async function verificarNombreLlamante(phoneNumber) {
    try {
        const lookup = await clientTwilio.lookups.phoneNumbers(phoneNumber).fetch({ type: ['caller-name'] });
        return lookup.callerName ? `👤 *Nombre del Titular*: ${lookup.callerName.caller_name}` : '👤 *Nombre del Titular*: No disponible';
    } catch (error) {
        console.error('Error al verificar el nombre del titular en Twilio:', error.message);
        return '⚠️ Error al verificar el nombre del titular.';
    }
}

// Función para obtener la geolocalización de la IP usando IPInfo con la API key proporcionada
async function obtenerUbicacionPorIP() {
    const apiKey = '2f1308d1be8442';  // Aquí va tu clave API de IPInfo
    const url = `https://ipinfo.io?token=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        return `🌍 *Ubicación*: Ciudad: ${data.city}, Región: ${data.region}, País: ${data.country}, Coordenadas: ${data.loc}`;
    } catch (error) {
        console.error('Error al obtener la ubicación con IPInfo:', error.message);
        return '⚠️ Error al obtener la ubicación.';
    }
}

// Función para manejar el comando .phone
async function handlePhoneCommand(phoneNumber, chatId, client) {
    const apiKeyNumVerify = '59f1b6048be4c4c61bcb3f2199acd4fd';  // Reemplaza con tu clave de API de NumVerify
    const urlNumVerify = `http://apilayer.net/api/validate?access_key=${apiKeyNumVerify}&number=${phoneNumber}&country_code=&format=1`;

    try {
        const response = await axios.get(urlNumVerify);
        const data = response.data;

        if (data.valid) {
            const operadora = operadoraMap[data.carrier] || data.carrier;
            const tipoLinea = data.line_type ? `📶 *Tipo de Línea*: ${data.line_type}` : '❔ Tipo de línea desconocido';
            const nombreLlamante = await verificarNombreLlamante(phoneNumber);
            const ubicacion = await obtenerUbicacionPorIP();

            // Armar el mensaje final
            const mensaje = `📱 *Operadora*: ${operadora}
🌍 *País*: ${data.country_name}
📞 *Formato Internacional*: ${data.international_format}
${tipoLinea}
${nombreLlamante}
${ubicacion}`;

            await client.sendMessage(chatId, mensaje);
        } else {
            await client.sendMessage(chatId, '❌ Número no válido o no se encontró información.');
        }
    } catch (error) {
        console.error('Error al obtener la operadora:', error.message);
        await client.sendMessage(chatId, '⚠️ Error al obtener la operadora.');
    }
}

module.exports = { handlePhoneCommand };
