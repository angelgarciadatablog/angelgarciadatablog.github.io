#!/usr/bin/env node

/**
 * Script para actualizar listas-reproduccion-playlist.json
 * node scripts/update-listas-reproduccion.js --clear-cache
 * Obtiene TODAS las playlists del canal desde la Cloud Function
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Obtener clearCache desde argumentos de línea de comando
const clearCache = process.argv.includes('--clear-cache');

// Leer configuración desde config/cursos.json
const configPath = path.join(__dirname, '..', 'config', 'cursos.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const CLOUD_FUNCTION_URL = config.cloudFunctionUrl;
const OUTPUT_FILE = path.join(__dirname, '../datos/listas-reproduccion-playlist.json');

/**
 * Fetch con promesa
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
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
 * Main
 */
async function main() {
  console.log('🚀 Actualizando listado de playlists del canal...\n');

  try {
    // Llamar a Cloud Function con action=listPlaylists
    let url = `${CLOUD_FUNCTION_URL}?action=listPlaylists&maxResults=50`;

    // Agregar parámetro clearCache si se especificó
    if (clearCache) {
      url += '&clearCache=true';
      console.log('🔄 Forzando actualización (ignorando caché)...');
    }

    console.log(`📡 Llamando a Cloud Function...`);
    console.log(`🔗 URL: ${url}\n`);

    const response = await fetchData(url);

    if (!response.success) {
      throw new Error(response.error || 'Error desconocido');
    }

    const playlists = response.data;
    console.log(`✅ ${playlists.length} playlists obtenidas`);

    // Preparar JSON final
    const output = {
      fechaActualizacion: new Date().toISOString(),
      totalPlaylists: playlists.length,
      playlists: playlists
    };

    // Guardar archivo
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

    console.log(`\n✅ Archivo actualizado: ${OUTPUT_FILE}`);
    console.log(`📊 Total de playlists: ${playlists.length}`);

    // Mostrar resumen
    console.log('\n📋 Playlists encontradas:');
    playlists.slice(0, 5).forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.title} (${p.videoCount} videos)`);
    });

    if (playlists.length > 5) {
      console.log(`   ... y ${playlists.length - 5} playlists más`);
    }

    console.log('\n💡 Este archivo se usa en: tutoriales/listas-reproduccion/index.html');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
