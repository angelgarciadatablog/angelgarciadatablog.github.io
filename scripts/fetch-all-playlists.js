#!/usr/bin/env node

/**
 * Script para obtener TODAS las playlists del canal de YouTube
 * Solo obtiene metadata (título, descripción, thumbnail, número de videos)
 * NO obtiene los videos individuales de cada playlist
 *
 * Costo: ~1 unidad de YouTube API por ejecución
 *
 * Uso:
 *   node scripts/fetch-all-playlists.js
 *
 * Salida:
 *   datos/tutoriales-playlists.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Leer configuración desde cursos.json para obtener la URL de la Cloud Function
const CONFIG_FILE = path.join(__dirname, '../config/cursos.json');
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

// IDs de playlists que son cursos (para excluirlas del listado)
const CURSO_PLAYLIST_IDS = [];

// Extraer IDs de playlists de cursos desde la config
config.cursos.forEach(curso => {
  curso.modulos.forEach(modulo => {
    CURSO_PLAYLIST_IDS.push(modulo.playlistId);
  });
});

console.log('🚀 Iniciando obtención de playlists del canal...\n');
console.log('═'.repeat(60));
console.log(`📋 Playlists de cursos (serán excluidas): ${CURSO_PLAYLIST_IDS.length}`);
console.log('─'.repeat(60));

/**
 * Llama a la Cloud Function con action=listPlaylists
 */
function fetchAllPlaylists() {
  return new Promise((resolve, reject) => {
    const url = `${config.cloudFunctionUrl}?action=listPlaylists&maxResults=50`;

    console.log('\n📡 Llamando a Cloud Function...');
    console.log(`   URL: ${url}`);

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (result.success) {
            console.log(`\n✅ ${result.totalPlaylists} playlists obtenidas del canal`);

            if (result.cached) {
              console.log(`   ℹ️  Datos desde caché (${result.cacheAge}s) - Sin consumo de cuota`);
            } else {
              console.log(`   📊 Costo estimado: ~1 unidad de YouTube API`);
            }

            resolve(result.data);
          } else {
            reject(new Error(result.message || 'Error al obtener playlists'));
          }
        } catch (error) {
          reject(new Error(`Error al parsear respuesta: ${error.message}`));
        }
      });

    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Filtra playlists excluyendo las que son cursos
 */
function filterTutorialPlaylists(allPlaylists) {
  return allPlaylists.filter(playlist => {
    return !CURSO_PLAYLIST_IDS.includes(playlist.id);
  });
}

/**
 * Función principal
 */
async function main() {
  const startTime = Date.now();

  try {
    // 1. Obtener todas las playlists
    const allPlaylists = await fetchAllPlaylists();

    // 2. NO filtrar - mostrar TODAS las playlists (incluyendo cursos)
    console.log('\n📚 Resumen de playlists:');
    console.log(`   Total del canal: ${allPlaylists.length}`);
    console.log(`   Todas las playlists serán guardadas (incluyendo cursos)`);

    if (allPlaylists.length === 0) {
      console.log('\n⚠️  No hay playlists para guardar');
      return;
    }

    // 3. Preparar datos para guardar (TODAS las playlists)
    const outputData = {
      fechaActualizacion: new Date().toISOString(),
      totalPlaylists: allPlaylists.length,
      playlists: allPlaylists
    };

    // 4. Guardar JSON
    const outputPath = path.join(__dirname, '../datos/tutoriales-playlists.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(outputData, null, 2),
      'utf8'
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '═'.repeat(60));
    console.log('\n🎉 ¡Proceso completado!\n');
    console.log('✅ Archivo guardado: datos/tutoriales-playlists.json');
    console.log(`⏱️  Tiempo total: ${duration}s`);

    console.log('\n📋 Playlists guardadas:');
    allPlaylists.forEach((playlist, index) => {
      console.log(`   ${index + 1}. ${playlist.title} (${playlist.videoCount} videos)`);
    });

    console.log('\n💡 Próximos pasos:');
    console.log('   1. Revisa el archivo datos/tutoriales-playlists.json');
    console.log('   2. Haz commit de los cambios');
    console.log('   3. La página tutoriales/listas-reproduccion cargará automáticamente estos datos\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main().catch(error => {
  console.error('\n💥 Error fatal:', error.message);
  process.exit(1);
});
