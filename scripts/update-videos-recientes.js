#!/usr/bin/env node

/**
 * Script para actualizar videos-recientes.json
 * Se ejecuta automáticamente via GitHub Actions
 * node scripts/update-videos-recientes.js [--clear-cache]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Obtener clearCache desde argumentos de línea de comando
const clearCache = process.argv.includes('--clear-cache');

// Configuración
const CLOUD_FUNCTION_URL = process.env.CLOUD_FUNCTION_URL || 'https://getyoutubevideos-35759247090.us-central1.run.app';
const OUTPUT_FILE = path.join(__dirname, '../datos/videos-recientes.json');

/**
 * Hace una petición HTTPS y retorna JSON
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Función principal
 */
async function main() {
  console.log('🎬 Iniciando actualización de videos recientes...');
  console.log(`📡 Cloud Function: ${CLOUD_FUNCTION_URL}`);

  try {
    // Llamar a Cloud Function
    let url = `${CLOUD_FUNCTION_URL}?action=getRecentVideos&maxResults=3`;

    // Agregar parámetro clearCache si se especificó
    if (clearCache) {
      url += '&clearCache=true';
      console.log('🔄 Forzando actualización (ignorando caché)...');
    }

    console.log(`🔗 Llamando: ${url}`);

    const result = await fetchJSON(url);

    if (!result.success) {
      throw new Error(result.error || 'Error al obtener videos');
    }

    const videos = result.data;
    console.log(`✅ ${videos.length} videos obtenidos`);

    // Transformar datos
    const videosFormatted = videos.map(video => ({
      id: video.id,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnail: video.thumbnail,
      publishedAt: video.publishedAt,
      description: video.description || ''
    }));

    // Preparar JSON de salida
    const output = {
      fechaActualizacion: new Date().toISOString(),
      totalVideos: videosFormatted.length,
      videos: videosFormatted
    };

    // Escribir archivo
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ Archivo actualizado: ${OUTPUT_FILE}`);
    console.log(`📅 Fecha: ${output.fechaActualizacion}`);

    // Mostrar resumen
    console.log('\n📊 Videos actualizados:');
    videosFormatted.forEach((video, index) => {
      console.log(`  ${index + 1}. ${video.title}`);
      console.log(`     🔗 ${video.url}`);
      console.log(`     📅 ${new Date(video.publishedAt).toLocaleDateString('es-ES')}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
