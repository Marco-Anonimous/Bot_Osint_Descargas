const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para obtener la ubicación GPS a partir de los metadatos
function obtenerUbicacionDeLaFoto(lines) {
    let latitude = '';
    let longitude = '';
    let latRef = '';
    let lonRef = '';
    
    lines.forEach(line => {
        if (line.includes('GPS Latitude')) {
            latitude = line.split(':')[1].trim();
        } else if (line.includes('GPS Longitude')) {
            longitude = line.split(':')[1].trim();
        } else if (line.includes('GPS Latitude Ref')) {
            latRef = line.split(':')[1].trim();
        } else if (line.includes('GPS Longitude Ref')) {
            lonRef = line.split(':')[1].trim();
        }
    });

    // Si se encontraron las coordenadas, formatearlas correctamente
    if (latitude && longitude) {
        const lat = `${latRef} ${latitude}`;
        const lon = `${lonRef} ${longitude}`;
        return `Ubicación GPS:\nLatitud: ${lat}\nLongitud: ${lon}`;
    } else {
        return 'No se pudo encontrar la ubicación en los metadatos.';
    }
}

// Función principal del comando .foto
async function handleFotoCommand(message, chatId, client) {
    const tempDir = './tmp';
    const exiftoolPath = 'C:\\Gata\\exiftool\\exiftool.exe';  // Ruta completa a exiftool.exe

    // Verificar si la carpeta tmp existe, si no, crearla
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    if (message.hasMedia) {
        try {
            // Descargar el archivo multimedia
            const media = await message.downloadMedia();
            
            // Guardar el archivo temporalmente
            const filePath = path.join(tempDir, `${Date.now()}.jpg`);  // Guardar en la carpeta tmp
            fs.writeFileSync(filePath, media.data, { encoding: 'base64' });

            // Ejecutar ExifTool para extraer metadatos
            exec(`${exiftoolPath} ${filePath}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error al ejecutar ExifTool: ${error.message}`);
                    client.sendMessage(chatId, 'Hubo un error al procesar la imagen.');
                    return;
                }
                
                if (stderr) {
                    console.error(`Error en ExifTool: ${stderr}`);
                    client.sendMessage(chatId, 'No se pudieron extraer los metadatos.');
                    return;
                }

                // Dividir la salida de ExifTool en líneas
                const lines = stdout.split('\n');
                let fileInfo = '';

                // Recolectar los metadatos con emojis
                lines.forEach(line => {
                    if (line.includes('File Name')) {
                        fileInfo += `📂 ${line}\n`;
                    } else if (line.includes('Directory')) {
                        fileInfo += `📂 ${line}\n`;
                    } else if (line.includes('Image Width') || line.includes('Image Height')) {
                        fileInfo += `📏 ${line}\n`;
                    } else if (line.includes('File Type') || line.includes('MIME Type') || line.includes('Encoding Process')) {
                        fileInfo += `📸 ${line}\n`;
                    } else if (line.trim() !== '') {
                        fileInfo += `🔧 ${line}\n`;  // Para otros datos técnicos
                    }
                });

                // Llamar a la función obtenerUbicacionDeLaFoto para extraer la ubicación GPS
                const ubicacion = obtenerUbicacionDeLaFoto(lines);

                // Enviar los metadatos extraídos al usuario
                client.sendMessage(chatId, `Metadatos de la imagen:\n${fileInfo}\n${ubicacion}`);

                // Eliminar el archivo temporal después de procesar
                fs.unlinkSync(filePath);
            });
        } catch (err) {
            console.error(`Error al manejar la imagen: ${err.message}`);
            client.sendMessage(chatId, 'Hubo un error al descargar la imagen.');
        }
    } else {
        client.sendMessage(chatId, 'Por favor, envía una imagen junto con el comando .foto.');
    }
}

module.exports = { handleFotoCommand };
