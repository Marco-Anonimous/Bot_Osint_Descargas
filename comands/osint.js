const fetch = require('node-fetch');
const whois = require('whois');
const url = require('url');

// Función para obtener datos de geolocalización de IP usando ipinfo.io API
async function getIPGeolocation(ip) {
    const apiUrl = `https://ipinfo.io/${ip}/json?token=2f1308d1be8442`; // Se reemplaza con tu token
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data && !data.error) {
        return data;
    } else {
        throw new Error('Error fetching geolocation data.');
    }
}

// Función para realizar una búsqueda WHOIS
function whoisLookup(domain) {
    return new Promise((resolve, reject) => {
        whois.lookup(domain, function (err, data) {
            if (err) {
                reject('Error performing WHOIS lookup.');
            } else {
                resolve(data);
            }
        });
    });
}

// Función para extraer el dominio desde una URL
function extractDomainFromUrl(inputUrl) {
    try {
        const parsedUrl = url.parse(inputUrl);
        return parsedUrl.hostname;  // Devuelve el dominio
    } catch (error) {
        throw new Error('Invalid URL provided.');
    }
}

// Función para limpiar el dominio (remover el prefijo 'www.')
function cleanDomain(domain) {
    // Elimina "www." del inicio del dominio si está presente
    if (domain.startsWith('www.')) {
        return domain.replace('www.', '');
    }
    return domain;
}

// Manejar los comandos OSINT
async function handleOSINTCommand(mensaje, chatId, client) {
    const commandParts = mensaje.split(' ');
    let target = commandParts[1];  // El dominio, URL o IP proporcionado por el usuario

    try {
        // Si el target es una URL, extraemos el dominio
        if (target.startsWith('http://') || target.startsWith('https://')) {
            target = extractDomainFromUrl(target);
        }

        // Limpia el dominio para eliminar "www."
        target = cleanDomain(target);

        // Verifica si el target es una IP (esto es un ejemplo básico)
        const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (ipPattern.test(target)) {
            // Si es una IP, buscamos su geolocalización
            const geoData = await getIPGeolocation(target);
            const response = `🌐 *IP Geolocation Information:*\n
                             📍 *IP:* ${geoData.ip || 'N/A'}
                             🌍 *Country:* ${geoData.country || 'N/A'}
                             🏙️ *City:* ${geoData.city || 'N/A'}
                             🗺️ *Region:* ${geoData.region || 'N/A'}
                             🏞️ *Location:* ${geoData.loc || 'N/A'}  // Coordenadas (lat, long)
                             ✉️ *Postal Code:* ${geoData.postal || 'N/A'}
                             *Org:* ${geoData.org || 'N/A'}`;
            await client.sendMessage(chatId, response);
        } else {
            // Si es un dominio, realizamos la búsqueda WHOIS
            const whoisData = await whoisLookup(target);
            await client.sendMessage(chatId, `📜 *WHOIS Information for ${target}:*\n\`\`\`${whoisData}\`\`\``);
        }
    } catch (error) {
        await client.sendMessage(chatId, `Error processing OSINT command: ${error.message}`);
    }
}

module.exports = { handleOSINTCommand };
