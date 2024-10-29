const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMP3Command } = require('./comands/mp3');
const { handleOSINTCommand } = require('./comands/osint');
const { handlePhoneCommand } = require('./comands/phone');
const { handleTikTokCommand } = require('./comands/tiktok');
const { handlePaginaWebCommand } = require('./comands/paginaweb');
const { handleFotoCommand } = require('./comands/foto');
const { handleWeatherCommand } = require('./comands/weather'); // Importa la función desde weather.js

let botActivo = false;

// Configurar cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,  // O false si quieres ver el navegador
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 300000  // Aumenta el tiempo de espera a 5 minutos
    }
    
});

// Mostrar el código QR en consola
client.on('qr', (qr) => {
    console.log('Escanea el código QR para iniciar sesión:');
    qrcode.generate(qr, { small: true });
});

// Indicar cuando el cliente esté listo
client.on('ready', () => {
    console.log('Cliente listo para recibir comandos.');
    botActivo = true;
});

// Verificar estado de la sesión
async function verificarEstadoCliente(chatId) {
    const state = await client.getState();
    if (state !== 'CONNECTED') {
        console.log('El cliente de WhatsApp no está conectado.');
        await client.sendMessage(chatId, '⚠️ Hubo un problema con la conexión de WhatsApp. Por favor, intenta de nuevo más tarde.');
        return false;
    }
    return true;
}

// Manejar los mensajes entrantes
client.on('message', async msg => {
    const chatId = msg.from;
    const mensaje = msg.body.toLowerCase().trim();

    try {
        // Verificar si el cliente está conectado antes de procesar cualquier comando
        if (!botActivo) {
            await client.sendMessage(chatId, '⚠️ El bot no está listo para procesar comandos en este momento. Por favor, espera un momento.');
            return;
        }

        // Verificar estado de conexión
        const estadoConectado = await verificarEstadoCliente(chatId);
        if (!estadoConectado) return;

        // Comando .mp3 para descargar la canción
        if (mensaje.startsWith('.mp3 ')) {
            await handleMP3Command(mensaje, chatId, client);
        }
        // Comando .tiktok para descargar el video de TikTok usando tiktok.js
        else if (mensaje.startsWith('.tiktok ')) {
            await handleTikTokCommand(mensaje, chatId, client);
        }
        // Comando .osint para herramientas de OSINT (dominio/IP)
        else if (mensaje.startsWith('.osint ')) {
            await handleOSINTCommand(mensaje, chatId, client);
        }
        // Comando .phone para buscar información de un número de teléfono
        else if (mensaje.startsWith('.phone ')) {
            const phoneNumber = mensaje.split(' ')[1];  // Extraer el número de teléfono del mensaje
            await handlePhoneCommand(phoneNumber, chatId, client);
        }
        // Comando .paginaweb para enviar la URL de la página web de ubicación
        else if (mensaje.startsWith('.paginaweb')) {
            await handlePaginaWebCommand(mensaje, chatId, client);
        }
        // Comando .foto para extraer metadatos de una imagen
        else if (mensaje.startsWith('.foto')) {
            await handleFotoCommand(msg, chatId, client);
        }
        // Comando .weather para obtener información del clima
        else if (mensaje.startsWith('.clima ')) {
            const city = mensaje.split(' ')[1];  // Extraer la ciudad del mensaje
            if (city) {
                await handleWeatherCommand(city, chatId, client);
            } else {
                await client.sendMessage(chatId, '⚠️ Por favor, proporciona una ciudad para consultar el clima.');
            }
        }
        // Comando .start para mostrar el menú de ayuda
        else if (mensaje === '.start') {
            const respuesta = `
┍━━━━━━━━━━━━━━━━━━━━•𖥔 ࣪˖
│「⬇ִָ 𖥔 ࣪˖Menú 𖥔 ࣪˖⬇」 
┕━━━━━━━━━━━━━━━━━━━━•𖥔 ࣪˖
🔥✰ ☞ *.mp3* (Nombre de la canción) 
    - Ejemplo: *.mp3 Despacito*
🔥✰ ☞ *.tiktok* (url)
🔥✰ ☞ *.osint* (Dominio o IP)
🔥✰ ☞ *.phone* (Número de teléfono en formato internacional)
    - Ejemplo: *.phone +51987654321*
🔥✰ ☞ *.paginaweb* (Envía un enlace para compartir la ubicación)
🔥✰ ☞ *.foto* (Envía una imagen para extraer metadatos)
🔥✰ ☞ *.clima* (Nombre de la ciudad)
    - Ejemplo: *.clima Lima*
🔥✰ ☞ *.info* (Información sobre el bot)
┃ ╰══ ⪨
╰╦════════════════════`;
            await client.sendMessage(chatId, respuesta);
        } 
        // Comando .info para información del bot
        else if (mensaje === '.info') {
            const respuesta = `
    *🤖 Hola, soy tu bot personalizado de WhatsApp, creado por [Docker]*!
    
    👤 *Creador:* [Docker]
    💼 *Función:* Automatización y herramientas de OSINT
    🌐 *Versión:* 2.0
            `;
            await client.sendMessage(chatId, respuesta);
        } else if (mensaje.startsWith('.')) {
            const respuesta = "No reconozco ese comando. Escribe .start para ver la lista de comandos disponibles.";
            await client.sendMessage(chatId, respuesta);
        }
    } catch (error) {
        console.error('Error manejando el comando:', error);
        const respuestaError = `⚠️ Ocurrió un error procesando el comando: ${error.message}. Intenta nuevamente o contacta con el administrador.`;
        await client.sendMessage(chatId, respuestaError, msg);
    }
});

// Manejar la desconexión del cliente
client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
    botActivo = false;
    console.log('Intentando reconectar en 5 segundos...');
    
    setTimeout(() => {
        client.destroy();
        client.initialize();
    }, 5000);  // Esperar 5 segundos antes de intentar reconectar
});

// Inicializar el cliente
client.initialize();
